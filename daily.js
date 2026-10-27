// Daily Planner: a time-ordered schedule plus upcoming deadlines and a completion summary.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { $, $$, esc, fmtDate, fmtTime, fmtNum, toast, confirmAction, openForm, field, panel, emptyState, bar, badge, stat, todayISO, addDays, ValidationError } from './utils.js';
import { state, getTasks, unwrap, isOverdue } from './data.js';

let planDate = todayISO();

export async function renderDaily(root) {
  const [items, tasks] = await Promise.all([
    unwrap(supabase.from('daily_plan').select('*').eq('plan_date', planDate).order('start_time')),
    getTasks(),
  ]);
  const today = todayISO();
  const dueToday = tasks.filter((x) => x.due_date === planDate);
  const upcoming = tasks.filter((x) => !x.is_done && x.due_date && x.due_date >= planDate && x.due_date <= addDays(planDate, 7));
  const overdue = tasks.filter((x) => isOverdue(x, today));

  const doneCount = items.filter((i) => i.is_done).length + dueToday.filter((x) => x.is_done).length;
  const totalCount = items.length + dueToday.length;
  const pct = totalCount ? (doneCount / totalCount) * 100 : 0;

  const schedule = items.length
    ? `<ul class="list">${items.map((i) => `<li class="task ${i.is_done ? 'done' : ''}">
        <input type="checkbox" data-toggle="${i.id}" ${i.is_done ? 'checked' : ''} aria-label="${esc(t('task.mark_done'))}: ${esc(i.title)}">
        <div class="task-main"><strong>${esc(i.title)}</strong><small class="num">${esc(fmtTime(i.start_time))}${i.end_time ? ` – ${esc(fmtTime(i.end_time))}` : ''}</small></div>
        <span class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${i.id}">${esc(t('common.edit'))}</button><button class="btn btn-ghost btn-sm" data-del="${i.id}">${esc(t('common.delete'))}</button></span></li>`).join('')}</ul>`
    : emptyState(t('daily.empty'));

  const taskList = (list) => `<ul class="list">${list.map((x) => `<li><span>${esc(x.title)}<br><small>${esc(fmtDate(x.due_date))}</small></span>${badge(t(`task.p_${x.priority}`), x.priority === 'high' ? 'warn' : 'neutral')}</li>`).join('')}</ul>`;

  root.innerHTML = `
    <div class="page-head"><h2>${esc(t('daily.title'))}</h2>
      <div class="date-nav"><button class="btn btn-sm" id="d-prev" aria-label="${esc(t('common.prev'))}">‹</button>
        <input type="date" id="d-date" value="${planDate}" aria-label="${esc(t('tx.date'))}">
        <button class="btn btn-sm" id="d-next" aria-label="${esc(t('common.next'))}">›</button>
        <button class="btn btn-sm" id="d-today">${esc(t('common.today'))}</button>
        <button class="btn btn-primary" id="d-add">${esc(t('daily.add'))}</button></div></div>
    <div class="grid grid-stats">
      ${stat(t('daily.completion'), totalCount ? `${fmtNum(pct)}%` : '—', pct === 100 && totalCount ? 'pos' : '', totalCount ? bar(pct, 'ok') : '')}
      ${stat(t('daily.plan_items'), `${fmtNum(items.filter((i) => i.is_done).length)} / ${fmtNum(items.length)}`)}
      ${stat(t('daily.tasks_due'), `${fmtNum(dueToday.filter((x) => x.is_done).length)} / ${fmtNum(dueToday.length)}`)}
    </div>
    <div class="grid grid-2">
      ${panel(t('daily.schedule'), schedule, '', true)}
      <div class="stack">
        ${panel(t('daily.upcoming'), upcoming.length ? taskList(upcoming) : `<p class="muted">${esc(t('daily.no_upcoming'))}</p>`)}
        ${overdue.length ? panel(t('daily.overdue'), taskList(overdue)) : ''}
      </div>
    </div>`;

  const go = (iso) => { planDate = iso || todayISO(); renderDaily(root); };
  $('#d-date', root).onchange = (e) => go(e.target.value);
  $('#d-prev', root).onclick = () => go(addDays(planDate, -1));
  $('#d-next', root).onclick = () => go(addDays(planDate, 1));
  $('#d-today', root).onclick = () => go(todayISO());
  $('#d-add', root).onclick = () => openItemForm(null, () => renderDaily(root));
  $$('[data-edit]', root).forEach((b) => (b.onclick = () => openItemForm(items.find((i) => i.id === b.dataset.edit), () => renderDaily(root))));
  $$('[data-toggle]', root).forEach((c) => (c.onchange = async () => {
    try { await unwrap(supabase.from('daily_plan').update({ is_done: c.checked }).eq('id', c.dataset.toggle)); renderDaily(root); }
    catch (err) { console.error(err); c.checked = !c.checked; toast(t('err.generic'), 'error'); }
  }));
  $$('[data-del]', root).forEach((b) => (b.onclick = async () => {
    if (!(await confirmAction(t('common.confirm_delete')))) return;
    try { await unwrap(supabase.from('daily_plan').delete().eq('id', b.dataset.del)); toast(t('common.deleted')); renderDaily(root); }
    catch (err) { console.error(err); toast(t('err.generic'), 'error'); }
  }));
}

function openItemForm(item, onDone) {
  openForm(t(item ? 'daily.edit' : 'daily.add'), `
    ${field('p-title', t('daily.activity'), `<input id="p-title" name="title" maxlength="120" value="${esc(item?.title || '')}" required>`)}
    <div class="row">${field('p-start', t('daily.start'), `<input id="p-start" name="start_time" type="time" value="${fmtTime(item?.start_time) || '09:00'}" required>`)}
      ${field('p-end', t('daily.end'), `<input id="p-end" name="end_time" type="time" value="${fmtTime(item?.end_time)}">`)}</div>`,
  async (d) => {
    const title = d.title.trim();
    if (!title || title.length > 120) throw new ValidationError(t('val.name_len'));
    if (!d.start_time) throw new ValidationError(t('val.time'));
    if (d.end_time && d.end_time <= d.start_time) throw new ValidationError(t('val.end_after_start'));
    const row = { title, start_time: d.start_time, end_time: d.end_time || null };
    if (item) await unwrap(supabase.from('daily_plan').update(row).eq('id', item.id));
    else await unwrap(supabase.from('daily_plan').insert({ ...row, plan_date: planDate, user_id: state.user.id }));
    toast(t('common.saved')); onDone();
  });
}
