// Dashboard: a calm summary of money and productivity.
import { t } from './i18n.js';
import { esc, money, fmtDate, fmtNum, panel, emptyState, bar, badge, stat, minutesToText, todayISO, addDays, levelOf } from './utils.js';
import { state, getTransactions, getBudgets, getTasks, getSessions, computeFinance, isOverdue } from './data.js';

export async function renderDashboard(root) {
  const [txs, budgets, tasks, sessions] = await Promise.all([getTransactions(), getBudgets(), getTasks(), getSessions()]);
  const f = computeFinance(txs, budgets, state.profile);
  const today = todayISO();
  const name = state.profile.display_name || state.user.email.split('@')[0];
  const totalBudget = f.budgetStatus.find((b) => b.category === 'total');

  const remaining = totalBudget
    ? stat(t('dash.remaining_budget'), money(totalBudget.remaining), totalBudget.remaining < 0 ? 'neg' : '', `${t('bud.of_limit', { n: money(totalBudget.limit) })}`)
    : stat(t('dash.remaining_budget'), `<span class="muted">${esc(t('common.not_set'))}</span>`, '', `<a href="#/budgets">${esc(t('dash.set_budget'))}</a>`);
  const savings = f.goalPct === null
    ? stat(t('dash.savings_progress'), `<span class="muted">${esc(t('common.not_set'))}</span>`, '', `<a href="#/budgets">${esc(t('dash.set_goal'))}</a>`)
    : stat(t('dash.savings_progress'), `${fmtNum(f.goalPct)}%`, f.goalPct >= 100 ? 'pos' : '', bar(f.goalPct, 'ok') + `<span>${esc(money(Math.max(f.balance, 0)))} / ${esc(money(f.goal))}</span>`);

  const warnings = f.budgetStatus.filter((b) => b.level !== 'ok');
  const warnHtml = warnings.length
    ? `<ul class="list">${warnings.map((b) => `<li><span>${esc(b.category === 'total' ? t('cat.total') : t(`cat.${b.category}`))}
        <small>${esc(money(b.spent))} / ${esc(money(b.limit))}</small></span>${badge(t(b.level === 'over' ? 'bud.over' : 'bud.near', { n: fmtNum(b.pct) }), b.level === 'over' ? 'danger' : 'warn')}</li>`).join('')}</ul>`
    : `<p class="muted">${esc(t(budgets.length ? 'dash.no_warnings' : 'dash.no_budgets'))}</p>`;

  const monthEntries = Object.entries(f.catMonth).sort((a, b) => b[1] - a[1]);
  const catHtml = monthEntries.length
    ? `<div class="stack">${monthEntries.map(([cat, amount]) => {
        const pct = (amount / f.mExpense) * 100;
        return `<div class="meter-row"><header><span>${esc(t(`cat.${cat}`))}</span><span class="num">${esc(money(amount))} · ${esc(fmtNum(pct))}%</span></header>${bar(pct, 'ok')}</div>`;
      }).join('')}</div>`
    : emptyState(t('dash.no_spending_month'));

  const recent = txs.slice(0, 5);
  const recentHtml = recent.length
    ? `<ul class="list">${recent.map((x) => `<li><span>${esc(x.description || t(`cat.${x.category}`))}<br><small>${esc(fmtDate(x.tx_date))} · ${esc(t(`cat.${x.category}`))}</small></span>
        <strong class="num ${x.type === 'income' ? 'pos' : 'neg'}">${x.type === 'income' ? '+' : '−'}${esc(money(x.amount))}</strong></li>`).join('')}</ul>`
    : emptyState(t('tx.empty'), `<a class="btn btn-primary" href="#/money">${esc(t('tx.add'))}</a>`);

  const upcoming = tasks.filter((x) => !x.is_done).slice(0, 5);
  const taskHtml = upcoming.length
    ? `<ul class="list">${upcoming.map((x) => `<li><span>${esc(x.title)}<br><small>${x.due_date ? esc(fmtDate(x.due_date)) : esc(t('task.no_due'))}</small></span>
        ${isOverdue(x, today) ? badge(t('task.overdue'), 'danger') : badge(t(`task.p_${x.priority}`), x.priority === 'high' ? 'warn' : 'neutral')}</li>`).join('')}</ul>`
    : emptyState(t('task.empty_open'), `<a class="btn" href="#/study">${esc(t('task.add'))}</a>`);

  const weekStart = addDays(today, -6);
  const todayMin = sessions.filter((s) => s.session_date === today).reduce((n, s) => n + s.actual_minutes, 0);
  const weekMin = sessions.filter((s) => s.session_date >= weekStart).reduce((n, s) => n + s.actual_minutes, 0);

  root.innerHTML = `
    <div class="page-head"><h2>${esc(t('dash.welcome', { name }))}</h2></div>
    <div class="grid grid-stats">
      ${stat(t('dash.balance'), esc(money(f.balance)), f.balance < 0 ? 'neg' : 'pos')}
      ${stat(t('dash.income'), esc(money(f.income)))}
      ${stat(t('dash.expenses'), esc(money(f.expense)))}
      ${stat(t('dash.month_spend'), esc(money(f.mExpense)))}
      ${remaining}
      ${savings}
    </div>
    <div class="grid grid-2">
      ${panel(t('dash.warnings'), warnHtml, `<a href="#/budgets">${esc(t('common.view_all'))}</a>`)}
      ${panel(t('dash.by_category'), catHtml)}
    </div>
    <div class="grid grid-2">
      ${panel(t('dash.recent'), recentHtml, `<a href="#/money">${esc(t('common.view_all'))}</a>`)}
      ${panel(t('dash.upcoming_tasks'), taskHtml, `<a href="#/study">${esc(t('common.view_all'))}</a>`)}
    </div>
    <div class="grid grid-stats">
      ${stat(t('dash.study_today'), esc(minutesToText(todayMin)))}
      ${stat(t('dash.study_week'), esc(minutesToText(weekMin)))}
    </div>`;
}
