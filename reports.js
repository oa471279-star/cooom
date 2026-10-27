// Reports: financial insights + six Chart.js charts built from real records.
import { t } from './i18n.js';
import { $, esc, money, fmtNum, fmtMonth, panel, emptyState, options, minutesToText, monthsBack, todayISO, addDays, levelOf, field } from './utils.js';
import { state, getTransactions, getBudgets, getTasks, getSessions, computeFinance, isOverdue } from './data.js';
import { drawChart, palette } from './charts.js';

let months = 6;

function insightsHtml(f) {
  const top = Object.entries(f.catAll).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const net = f.mIncome - f.mExpense;
  const li = (label, value) => `<li><span>${esc(label)}</span><strong class="num">${value}</strong></li>`;
  return `<div class="grid grid-2">
    ${panel(t('rep.top_categories'), top.length ? `<ul class="list">${top.map(([c, a]) => li(t(`cat.${c}`), `${esc(money(a))} · ${esc(fmtNum((a / f.expense) * 100))}%`)).join('')}</ul>` : emptyState(t('rep.no_data')))}
    ${panel(t('rep.averages'), `<ul class="list">${li(t('rep.daily_avg'), esc(money(f.dailyAvg)))}${li(t('rep.monthly_avg'), esc(money(f.monthlyAvgExpense)))}</ul>`)}
    ${panel(t('rep.income_vs_expense_month'), `<ul class="list">${li(t('dash.income'), `<span class="pos">${esc(money(f.mIncome))}</span>`)}${li(t('dash.expenses'), `<span class="neg">${esc(money(f.mExpense))}</span>`)}${li(t('tx.sum_net'), `<span class="${net < 0 ? 'neg' : 'pos'}">${esc(money(net))}</span>`)}</ul>`)}
    ${panel(t('rep.small_recurring'), f.smallRecurring.length ? `<ul class="list">${f.smallRecurring.map((g) => li(g.label, `${esc(money(g.total))} <small>(${esc(t('rep.times', { n: fmtNum(g.count) }))})</small>`)).join('')}</ul><small>${esc(t('rep.small_note'))}</small>` : `<p class="muted">${esc(t('rep.no_recurring'))}</p>`)}
    ${panel(t('rep.savings'), `<ul class="list">${li(t('rep.actual_savings'), `<span class="${f.balance < 0 ? 'neg' : 'pos'}">${esc(money(f.balance))}</span>`)}
      ${li(`${t('rep.est_savings')} <span class="badge badge-warn">${esc(t('bud.estimate_tag'))}</span>`, f.estMonthlySaving === null ? '—' : esc(money(f.estMonthlySaving)))}</ul><small>${esc(t('bud.estimate_note'))}</small>`)}
  </div>`;
}

export async function renderReports(root) {
  const [txs, budgets, tasks, sessions] = await Promise.all([getTransactions(), getBudgets(), getTasks(), getSessions()]);
  const f = computeFinance(txs, budgets, state.profile);
  const keys = monthsBack(months);
  const today = todayISO();
  const colors = palette();
  const box = (id, title, hasData) => panel(title, hasData ? `<div class="chart-box"><canvas id="${id}" role="img" aria-label="${esc(title)}"></canvas></div>` : emptyState(t('rep.no_data')));

  const catPeriod = {};
  txs.filter((x) => x.type === 'expense' && keys.includes(x.tx_date.slice(0, 7))).forEach((x) => { catPeriod[x.category] = (catPeriod[x.category] || 0) + Number(x.amount); });
  const periodStart = `${keys[0]}-01`;
  const hours = {};
  sessions.filter((s) => s.session_date >= periodStart).forEach((s) => { hours[s.subject] = (hours[s.subject] || 0) + s.actual_minutes / 60; });
  const done = tasks.filter((x) => x.is_done).length;
  const overdue = tasks.filter((x) => isOverdue(x, today)).length;
  const open = tasks.length - done - overdue;
  const hasMoney = keys.some((k) => f.byMonth[k]);

  root.innerHTML = `
    <div class="page-head"><h2>${esc(t('rep.title'))}</h2>
      <div class="field" style="margin:0">${`<label for="rep-period">${esc(t('rep.period'))}</label><select id="rep-period">${options(['3', '6', '12'], String(months), (v) => t('rep.months_n', { n: fmtNum(Number(v)) }))}</select>`}</div></div>
    <h3 class="chart-label" style="margin-bottom:.75rem">${esc(t('rep.insights'))}</h3>
    ${insightsHtml(f)}
    <div class="grid grid-2">
      ${box('c-iv', t('rep.income_vs_expenses'), hasMoney)}
      ${box('c-trend', t('rep.monthly_trend'), hasMoney)}
      ${box('c-cat', t('rep.by_category'), Object.keys(catPeriod).length > 0)}
      ${box('c-bud', t('rep.budget_util'), f.budgetStatus.length > 0)}
      ${box('c-study', t('rep.study_hours'), Object.keys(hours).length > 0)}
      ${box('c-task', t('rep.task_completion'), tasks.length > 0)}
    </div>`;

  $('#rep-period', root).onchange = (e) => { months = Number(e.target.value); renderReports(root); };
  const labels = keys.map(fmtMonth);
  const c = (id) => $(`#${id}`, root);

  drawChart(c('c-iv'), 'bar', { labels, datasets: [
    { label: t('type.income'), data: keys.map((k) => f.byMonth[k]?.income || 0), backgroundColor: colors[1] },
    { label: t('type.expense'), data: keys.map((k) => f.byMonth[k]?.expense || 0), backgroundColor: colors[0] }] });
  drawChart(c('c-trend'), 'line', { labels, datasets: [{ label: t('type.expense'), data: keys.map((k) => f.byMonth[k]?.expense || 0), borderColor: colors[2], backgroundColor: colors[2], tension: .25 }] });
  drawChart(c('c-cat'), 'doughnut', { labels: Object.keys(catPeriod).map((k) => t(`cat.${k}`)), datasets: [{ data: Object.values(catPeriod), backgroundColor: colors }] });
  drawChart(c('c-bud'), 'bar', { labels: f.budgetStatus.map((b) => (b.category === 'total' ? t('cat.total') : t(`cat.${b.category}`))),
    datasets: [{ label: t('bud.used_pct'), data: f.budgetStatus.map((b) => Math.round(b.pct)), backgroundColor: f.budgetStatus.map((b) => ({ ok: colors[1], warn: colors[3], over: colors[4] }[levelOf(b.pct)])) }] },
    { plugins: { legend: { display: false } } });
  drawChart(c('c-study'), 'bar', { labels: Object.keys(hours), datasets: [{ label: t('study.hours'), data: Object.values(hours).map((h) => Math.round(h * 10) / 10), backgroundColor: colors[2] }] },
    { plugins: { legend: { display: false } } });
  drawChart(c('c-task'), 'doughnut', { labels: [t('task.s_done'), t('task.s_open'), t('task.overdue')], datasets: [{ data: [done, open, overdue], backgroundColor: [colors[1], colors[2], colors[4]] }] });
}
