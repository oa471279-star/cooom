// Tasks: add / edit / complete / delete, with deadlines, priorities, categories and filters.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { $, $$, esc, fmtDate, toast, confirmAction, openForm, field, options, badge, emptyState, todayISO, addDays, ValidationError } from './utils.js';
import { state, getTasks, invalidate, unwrap, isOverdue, TASK_CATS, PRIORITIES } from './data.js';

const tf = { status: 'open', category: '', due: '' };

export async function renderTasksPanel(root) {
  root.innerHTML = `
    <div class="toolbar"><div class="row">
      ${field('tf-status', t('task.status'), `<select id="tf-status">${options(['all', 'open', 'done', 'overdue'], tf.status, (v) => t(`task.s_${v}`))}</select>`)}
      ${field('tf-cat', t('tx.category'), `<select id="tf-cat"><option value="">${esc(t('common.all'))}</option>${options(TASK_CATS, tf.category, (v) => t(`task.c_${v}`))}</select>`)}
      ${field('tf-due', t('task.due'), `<select id="tf-due"><option value="">${esc(t('common.all'))}</option>${options(['today', 'week', 'none'], tf.due, (v) => t(`task.d_${v}`))}</select>`)}
      <button class="btn btn-primary" id="task-add" type="button">${esc(t('task.add'))}</button>
    </div></div>
    <section class="panel"><div class="panel-body" id="task-list"></div></section>`;
  [['#tf-status', 'status'], ['#tf-cat', 'category'], ['#tf-due', 'due']].forEach(([sel, key]) =>
    $(sel, root).addEventListener('change', (e) => { tf[key] = e.target.value; draw(root); }));
  $('#task-add', root).onclick = () => openTaskForm(null, () => draw(root));
  await draw(root);
}

async function draw(root) {
  const all = await getTasks();
  const today = todayISO();
  const list = all.filter((x) =>
    (tf.status === 'all' || (tf.status === 'open' && !x.is_done) || (tf.status === 'done' && x.is_done) || (tf.status === 'overdue' && isOverdue(x, today))) &&
    (!tf.category || x.category === tf.category) &&
    (!tf.due || (tf.due === 'today' && x.due_date === today) || (tf.due === 'week' && x.due_date && x.due_date >= today && x.due_date <= addDays(today, 7)) || (tf.due === 'none' && !x.due_date)));
  list.sort((a, b) => a.is_done - b.is_done || (a.due_date || '9999').localeCompare(b.due_date || '9999'));

  const box = $('#task-list', root);
  if (!list.length) { box.innerHTML = emptyState(t(all.length ? 'task.empty_filtered' : 'task.empty')); return; }
  box.innerHTML = `<ul class="list">${list.map((x) => `
    <li class="task ${x.is_done ? 'done' : ''}">
      <input type="checkbox" data-toggle="${x.id}" ${x.is_done ? 'checked' : ''} aria-label="${esc(t('task.mark_done'))}: ${esc(x.title)}">
      <div class="task-main"><strong>${esc(x.title)}</strong>${x.notes ? `<small>${esc(x.notes)}</small>` : ''}
        <div class="meta">${badge(t(`task.c_${x.category}`))}${badge(t(`task.p_${x.priority}`), x.priority === 'high' ? 'warn' : 'neutral')}
        ${x.due_date ? `<span class="${isOverdue(x, today) ? 'neg' : 'muted'}">${esc(fmtDate(x.due_date))}</span>` : ''}${isOverdue(x, today) ? badge(t('task.overdue'), 'danger') : ''}</div></div>
      <span class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${x.id}">${esc(t('common.edit'))}</button>
      <button class="btn btn-ghost btn-sm" data-del="${x.id}">${esc(t('common.delete'))}</button></span></li>`).join('')}</ul>`;

  $$('[data-toggle]', box).forEach((c) => (c.onchange = async () => {
    try {
      await unwrap(supabase.from('tasks').update({ is_done: c.checked, completed_at: c.checked ? new Date().toISOString() : null }).eq('id', c.dataset.toggle));
      invalidate('tasks'); draw(root);
    } catch (err) { console.error(err); c.checked = !c.checked; toast(t('err.generic'), 'error'); }
  }));
  $$('[data-edit]', box).forEach((b) => (b.onclick = () => openTaskForm(all.find((x) => x.id === b.dataset.edit), () => draw(root))));
  $$('[data-del]', box).forEach((b) => (b.onclick = async () => {
    if (!(await confirmAction(t('common.confirm_delete')))) return;
    try { await unwrap(supabase.from('tasks').delete().eq('id', b.dataset.del)); invalidate('tasks'); toast(t('common.deleted')); draw(root); }
    catch (err) { console.error(err); toast(t('err.generic'), 'error'); }
  }));
}

export function openTaskForm(task, onDone) {
  openForm(t(task ? 'task.edit' : 'task.add'), `
    ${field('t-title', t('task.name'), `<input id="t-title" name="title" maxlength="120" value="${esc(task?.title || '')}" required>`)}
    ${field('t-notes', t('task.notes'), `<textarea id="t-notes" name="notes" maxlength="500">${esc(task?.notes || '')}</textarea>`)}
    <div class="row">
      ${field('t-cat', t('tx.category'), `<select id="t-cat" name="category">${options(TASK_CATS, task?.category || 'study', (v) => t(`task.c_${v}`))}</select>`)}
      ${field('t-pri', t('task.priority'), `<select id="t-pri" name="priority">${options(PRIORITIES, task?.priority || 'medium', (v) => t(`task.p_${v}`))}</select>`)}
    </div>
    ${field('t-due', t('task.due'), `<input id="t-due" name="due_date" type="date" value="${task?.due_date || ''}">`)}`,
  async (d) => {
    const title = d.title.trim();
    if (!title || title.length > 120) throw new ValidationError(t('val.name_len'));
    if (d.notes.length > 500) throw new ValidationError(t('val.text_len'));
    if (d.due_date && Number.isNaN(Date.parse(d.due_date))) throw new ValidationError(t('val.date'));
    const row = { title, notes: d.notes.trim(), category: d.category, priority: d.priority, due_date: d.due_date || null };
    if (task) await unwrap(supabase.from('tasks').update(row).eq('id', task.id));
    else await unwrap(supabase.from('tasks').insert({ ...row, user_id: state.user.id }));
    invalidate('tasks'); toast(t('common.saved')); onDone();
  });
}
