// Budgets: monthly total + per-category limits, warnings, and the savings goal.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { $, $$, esc, money, fmtNum, toast, confirmAction, openForm, field, options, panel, emptyState, bar, badge, stat, ValidationError } from './utils.js';
import { state, getTransactions, getBudgets, invalidate, unwrap, computeFinance, EXPENSE_CATS } from './data.js';

export async function renderBudgets(root) {
  const [txs, budgets] = await Promise.all([getTransactions(), getBudgets()]);
  const f = computeFinance(txs, budgets, state.profile);
  const label = (c) => (c === 'total' ? t('cat.total') : t(`cat.${c}`));

  const rows = f.budgetStatus.length
    ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('bud.category'))}</th><th>${esc(t('bud.limit'))}</th><th>${esc(t('bud.spent'))}</th><th>${esc(t('bud.remaining'))}</th><th style="min-width:160px">${esc(t('bud.used'))}</th><th></th></tr></thead><tbody>
      ${f.budgetStatus.map((b) => `<tr><td>${esc(label(b.category))}</td><td class="amount">${esc(money(b.limit))}</td><td class="amount">${esc(money(b.spent))}</td>
        <td class="amount ${b.remaining < 0 ? 'neg' : ''}">${esc(money(b.remaining))}</td>
        <td>${bar(b.pct, b.level)}<small>${esc(fmtNum(b.pct))}% ${b.level !== 'ok' ? badge(t(b.level === 'over' ? 'bud.over_short' : 'bud.near_short'), b.level === 'over' ? 'danger' : 'warn') : ''}</small></td>
        <td><span class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${b.category}">${esc(t('common.edit'))}</button>
        <button class="btn btn-ghost btn-sm" data-del="${b.category}">${esc(t('common.delete'))}</button></span></td></tr>`).join('')}
      </tbody></table></div>`
    : emptyState(t('bud.empty'), `<button class="btn btn-primary" id="bud-add-empty">${esc(t('bud.set'))}</button>`);

  const goal = f.goal
    ? `<div class="stack"><div class="meter-row"><header><span>${esc(t('bud.actual_savings'))}</span><span class="num">${esc(money(Math.max(f.balance, 0)))} / ${esc(money(f.goal))}</span></header>${bar(f.goalPct, 'ok')}</div>
       <p class="muted">${esc(t('bud.month_net'))}: <strong class="num ${f.monthNet < 0 ? 'neg' : 'pos'}">${esc(money(f.monthNet))}</strong></p></div>`
    : `<p class="muted">${esc(t('bud.no_goal'))}</p>`;

  const estimate = f.estMonthlySaving === null
    ? `<p class="muted">${esc(t('bud.est_need_data'))}</p>`
    : `<p>${esc(t('bud.est_monthly'))}: <strong class="num ${f.estMonthlySaving < 0 ? 'neg' : 'pos'}">${esc(money(f.estMonthlySaving))}</strong></p>
       ${f.goal ? `<p>${esc(f.monthsToGoal === null ? t('bud.est_not_reachable') : t('bud.est_months', { n: fmtNum(f.monthsToGoal) }))}</p>` : ''}`;

  root.innerHTML = `
    <div class="page-head"><h2>${esc(t('bud.title'))}</h2><button class="btn btn-primary" id="bud-add">${esc(t('bud.set'))}</button></div>
    <p class="muted">${esc(t('bud.month_note'))}</p>
    ${panel(t('bud.list'), rows, '', true)}
    <div class="grid grid-2">
      ${panel(t('bud.goal_title'), goal, `<button class="btn btn-sm" id="goal-edit">${esc(t('bud.goal_set'))}</button>`)}
      ${panel(t('bud.est_title'), `<span class="badge badge-warn">${esc(t('bud.estimate_tag'))}</span><div class="stack">${estimate}<small>${esc(t('bud.estimate_note'))}</small></div>`)}
    </div>`;

  const openSet = (category) => openForm(t('bud.set'), `
    ${field('b-cat', t('bud.category'), `<select id="b-cat" name="category">${options(['total', ...EXPENSE_CATS], category, label)}</select>`)}
    ${field('b-amount', t('bud.limit'), `<input id="b-amount" name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" value="${budgets.find((b) => b.category === category)?.amount ?? ''}" required>`)}`,
  async (d) => {
    const amount = Math.round(Number(d.amount) * 100) / 100;
    if (!(amount > 0) || amount >= 1e9) throw new ValidationError(t('val.amount'));
    await unwrap(supabase.from('budgets').upsert({ user_id: state.user.id, category: d.category, amount }, { onConflict: 'user_id,category' }));
    invalidate('budgets'); toast(t('common.saved')); renderBudgets(root);
  });

  $('#bud-add', root).onclick = () => openSet('total');
  $('#bud-add-empty', root)?.addEventListener('click', () => openSet('total'));
  $$('[data-edit]', root).forEach((b) => (b.onclick = () => openSet(b.dataset.edit)));
  $$('[data-del]', root).forEach((b) => (b.onclick = async () => {
    if (!(await confirmAction(t('common.confirm_delete')))) return;
    try { await unwrap(supabase.from('budgets').delete().eq('category', b.dataset.del)); invalidate('budgets'); toast(t('common.deleted')); renderBudgets(root); }
    catch (err) { console.error(err); toast(t('err.generic'), 'error'); }
  }));
  $('#goal-edit', root).onclick = () => openForm(t('bud.goal_set'), field('g-amount', t('bud.goal_label'),
    `<input id="g-amount" name="goal" type="number" step="0.01" min="0" inputmode="decimal" value="${f.goal || ''}">`, t('bud.goal_hint')),
  async (d) => {
    const goal = d.goal === '' ? null : Math.round(Number(d.goal) * 100) / 100;
    if (goal !== null && (!(goal >= 0) || goal >= 1e9)) throw new ValidationError(t('val.amount'));
    await unwrap(supabase.from('profiles').update({ savings_goal: goal }).eq('id', state.user.id));
    state.profile.savings_goal = goal; toast(t('common.saved')); renderBudgets(root);
  });
}
