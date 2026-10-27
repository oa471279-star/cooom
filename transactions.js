// Money Manager: add / edit / delete / search / filter income and expenses.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { PAGE_SIZE } from './config.js';
import { $, $$, esc, money, fmtDate, toast, confirmAction, openForm, field, options, emptyState, pagerHtml, badge, debounce, todayISO, ValidationError, stat, fmtNum } from './utils.js';
import { state, getTransactions, invalidate, unwrap, EXPENSE_CATS, INCOME_CATS } from './data.js';

const filters = { q: '', type: '', category: '', from: '', to: '', page: 1 };
const ALL_CATS = [...new Set([...EXPENSE_CATS, ...INCOME_CATS])];

export async function renderTransactions(root) {
  root.innerHTML = `
    <div class="page-head"><h2>${esc(t('tx.title'))}</h2><button class="btn btn-primary" id="tx-add">${esc(t('tx.add'))}</button></div>
    <form class="toolbar" id="tx-filters" aria-label="${esc(t('tx.filters'))}">
      <div class="row">
        ${field('flt-q', t('common.search'), `<input id="flt-q" type="search" value="${esc(filters.q)}" placeholder="${esc(t('tx.search_ph'))}">`)}
        ${field('flt-type', t('tx.type'), `<select id="flt-type"><option value="">${esc(t('common.all'))}</option>${options(['income', 'expense'], filters.type, (v) => t(`type.${v}`))}</select>`)}
        ${field('flt-cat', t('tx.category'), `<select id="flt-cat"><option value="">${esc(t('common.all'))}</option>${options(ALL_CATS, filters.category, (v) => t(`cat.${v}`))}</select>`)}
        ${field('flt-from', t('common.from'), `<input id="flt-from" type="date" value="${filters.from}">`)}
        ${field('flt-to', t('common.to'), `<input id="flt-to" type="date" value="${filters.to}">`)}
        <button type="button" class="btn btn-ghost" id="flt-reset">${esc(t('common.reset'))}</button>
      </div>
    </form>
    <div id="tx-summary" class="grid grid-stats"></div>
    <section class="panel"><div class="panel-body flush" id="tx-table"></div></section>`;

  $('#tx-add', root).onclick = () => openTxForm(null, () => draw(root));
  const bind = (sel, key, ev = 'change') => $(sel, root).addEventListener(ev, (e) => { filters[key] = e.target.value; filters.page = 1; draw(root); });
  bind('#flt-q', 'q', 'input');
  bind('#flt-type', 'type'); bind('#flt-cat', 'category'); bind('#flt-from', 'from'); bind('#flt-to', 'to');
  $('#flt-reset', root).onclick = () => { Object.assign(filters, { q: '', type: '', category: '', from: '', to: '', page: 1 }); renderTransactions(root); };
  $('#tx-filters', root).onsubmit = (e) => e.preventDefault();
  await draw(root);
}

async function draw(root) {
  const all = await getTransactions();
  const q = filters.q.trim().toLowerCase();
  const list = all.filter((x) =>
    (!filters.type || x.type === filters.type) && (!filters.category || x.category === filters.category) &&
    (!filters.from || x.tx_date >= filters.from) && (!filters.to || x.tx_date <= filters.to) &&
    (!q || x.description.toLowerCase().includes(q) || t(`cat.${x.category}`).toLowerCase().includes(q)));

  const income = list.filter((x) => x.type === 'income').reduce((n, x) => n + Number(x.amount), 0);
  const expense = list.filter((x) => x.type === 'expense').reduce((n, x) => n + Number(x.amount), 0);
  $('#tx-summary', root).innerHTML = stat(t('tx.sum_income'), esc(money(income)), 'pos') + stat(t('tx.sum_expense'), esc(money(expense)), 'neg') + stat(t('tx.sum_net'), esc(money(income - expense)), income - expense < 0 ? 'neg' : '');

  const box = $('#tx-table', root);
  if (!list.length) {
    box.innerHTML = emptyState(t(all.length ? 'tx.empty_filtered' : 'tx.empty'));
    return;
  }
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  filters.page = Math.min(filters.page, pages);
  const rows = list.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);

  box.innerHTML = `<div class="table-wrap"><table><thead><tr>
      <th>${esc(t('tx.date'))}</th><th>${esc(t('tx.description'))}</th><th>${esc(t('tx.category'))}</th><th>${esc(t('tx.amount'))}</th><th><span class="sr-only">${esc(t('common.actions'))}</span></th></tr></thead><tbody>
    ${rows.map((x) => `<tr><td>${esc(fmtDate(x.tx_date))}</td><td>${esc(x.description) || '—'}</td><td>${badge(t(`cat.${x.category}`))}</td>
      <td class="amount ${x.type === 'income' ? 'pos' : 'neg'}">${x.type === 'income' ? '+' : '−'}${esc(money(x.amount))}</td>
      <td><span class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${x.id}">${esc(t('common.edit'))}</button>
      <button class="btn btn-ghost btn-sm" data-del="${x.id}">${esc(t('common.delete'))}</button></span></td></tr>`).join('')}
    </tbody></table></div>${pagerHtml(filters.page, pages, list.length)}`;

  $$('[data-edit]', box).forEach((b) => (b.onclick = () => openTxForm(all.find((x) => x.id === b.dataset.edit), () => draw(root))));
  $$('[data-del]', box).forEach((b) => (b.onclick = async () => {
    if (!(await confirmAction(t('common.confirm_delete')))) return;
    try {
      await unwrap(supabase.from('transactions').delete().eq('id', b.dataset.del));
      invalidate('tx'); toast(t('common.deleted')); draw(root);
    } catch (err) { toast(t('err.generic'), 'error'); console.error(err); }
  }));
  $$('[data-page]', box).forEach((b) => (b.onclick = () => { filters.page = Number(b.dataset.page); draw(root); }));
}

function openTxForm(tx, onDone) {
  const type = tx?.type || 'expense';
  const catOptions = (tp, sel) => options(tp === 'income' ? INCOME_CATS : EXPENSE_CATS, sel, (v) => t(`cat.${v}`));
  const form = openForm(t(tx ? 'tx.edit' : 'tx.add'), `
    ${field('f-type', t('tx.type'), `<select id="f-type" name="type">${options(['expense', 'income'], type, (v) => t(`type.${v}`))}</select>`)}
    ${field('f-amount', t('tx.amount'), `<input id="f-amount" name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" value="${tx ? tx.amount : ''}" required>`)}
    ${field('f-category', t('tx.category'), `<select id="f-category" name="category">${catOptions(type, tx?.category)}</select>`)}
    ${field('f-description', t('tx.description'), `<input id="f-description" name="description" maxlength="200" value="${esc(tx?.description || '')}">`)}
    ${field('f-date', t('tx.date'), `<input id="f-date" name="tx_date" type="date" value="${tx?.tx_date || todayISO()}" required>`)}`,
  async (d) => {
    const amount = Math.round(Number(d.amount) * 100) / 100;
    if (!(amount > 0) || amount >= 1e9) throw new ValidationError(t('val.amount'));
    if (!d.tx_date || Number.isNaN(Date.parse(d.tx_date))) throw new ValidationError(t('val.date'));
    if (d.description.length > 200) throw new ValidationError(t('val.text_len'));
    if (!(d.type === 'income' ? INCOME_CATS : EXPENSE_CATS).includes(d.category)) throw new ValidationError(t('val.required'));
    const row = { type: d.type, amount, category: d.category, description: d.description.trim(), tx_date: d.tx_date };
    if (tx) await unwrap(supabase.from('transactions').update(row).eq('id', tx.id));
    else await unwrap(supabase.from('transactions').insert({ ...row, user_id: state.user.id }));
    invalidate('tx');
    toast(t(tx ? 'common.saved' : 'tx.added'));
    onDone();
  });
  // Category choices depend on the transaction type.
  $('#f-type', form).onchange = (e) => { $('#f-category', form).innerHTML = catOptions(e.target.value); };
}
