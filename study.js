// Study Planner view: tasks tab + study sessions, weekly summary and a Pomodoro timer.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { $, $$, esc, toast, confirmAction, openForm, field, panel, emptyState, bar, stat, minutesToText, fmtDate, fmtWeekday, fmtNum, todayISO, addDays, friendlyError, ValidationError } from './utils.js';
import { state, getSessions, invalidate, unwrap } from './data.js';
import { renderTasksPanel } from './tasks.js';

let activeTab = 'tasks';

/* ---------------- Pomodoro (module-level so it keeps running while you navigate) ---------------- */
const pomo = { mode: 'focus', running: false, endAt: 0, remaining: 25 * 60, focusMin: 25, breakMin: 5, subject: '', timer: null };
let sessionsRoot = null;

const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function paint() {
  const time = document.getElementById('pomo-time');
  if (!time) return;
  time.textContent = clock(pomo.remaining);
  $('#pomo-mode').textContent = t(pomo.mode === 'focus' ? 'study.focus' : 'study.break');
  $('#pomo-toggle').textContent = t(pomo.running ? 'study.pause' : 'study.start');
}

export function stopPomodoro() {
  clearInterval(pomo.timer);
  Object.assign(pomo, { running: false, mode: 'focus', remaining: pomo.focusMin * 60 });
  document.title = 'Balance';
}

function tick() {
  if (!pomo.running) return;
  pomo.remaining = Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
  document.title = `${clock(pomo.remaining)} · Balance`;
  paint();
  if (pomo.remaining <= 0) completePhase();
}

async function completePhase() {
  clearInterval(pomo.timer);
  pomo.running = false;
  document.title = 'Balance';
  if (pomo.mode === 'focus') {
    try {
      await unwrap(supabase.from('study_sessions').insert({
        user_id: state.user.id, subject: pomo.subject, target_minutes: pomo.focusMin, actual_minutes: pomo.focusMin, session_date: todayISO(),
      }));
      invalidate('sessions');
      toast(t('study.focus_done', { n: pomo.focusMin }));
    } catch (err) { toast(friendlyError(err), 'error'); }
    Object.assign(pomo, { mode: 'break', remaining: pomo.breakMin * 60 });
  } else {
    Object.assign(pomo, { mode: 'focus', remaining: pomo.focusMin * 60 });
    toast(t('study.break_done'));
  }
  paint();
  if (document.getElementById('sessions-list') && sessionsRoot) refreshSessions();
}

function togglePomodoro() {
  if (pomo.running) {
    pomo.remaining = Math.max(0, Math.round((pomo.endAt - Date.now()) / 1000));
    pomo.running = false;
    clearInterval(pomo.timer);
    document.title = 'Balance';
    return paint();
  }
  pomo.subject = $('#pomo-subject').value.trim();
  if (pomo.mode === 'focus' && !pomo.subject) return toast(t('study.need_subject'), 'error');
  pomo.endAt = Date.now() + pomo.remaining * 1000;
  pomo.running = true;
  pomo.timer = setInterval(tick, 500);
  paint();
}

function applyDurations() {
  const focus = Math.min(120, Math.max(1, Number($('#pomo-focus').value) || 25));
  const rest = Math.min(60, Math.max(1, Number($('#pomo-break').value) || 5));
  Object.assign(pomo, { focusMin: focus, breakMin: rest });
  if (!pomo.running) { pomo.remaining = (pomo.mode === 'focus' ? focus : rest) * 60; paint(); }
}

/* ---------------- View ---------------- */
export async function renderStudy(root) {
  root.innerHTML = `
    <div class="tabs" role="tablist">
      <button role="tab" data-tab="tasks" aria-selected="${activeTab === 'tasks'}">${esc(t('study.tab_tasks'))}</button>
      <button role="tab" data-tab="sessions" aria-selected="${activeTab === 'sessions'}">${esc(t('study.tab_sessions'))}</button>
    </div><div id="study-body"></div>`;
  $$('[data-tab]', root).forEach((b) => (b.onclick = () => { activeTab = b.dataset.tab; renderStudy(root); }));
  const body = $('#study-body', root);
  if (activeTab === 'tasks') await renderTasksPanel(body);
  else await renderSessionsPanel(body);
}

async function renderSessionsPanel(body) {
  sessionsRoot = body;
  const subjects = [...new Set((await getSessions()).map((s) => s.subject))];
  body.innerHTML = `
    <div id="week-summary"></div>
    <div class="grid grid-2">
      <section class="panel pomodoro"><header class="panel-head"><h2>${esc(t('study.pomodoro'))}</h2></header><div class="panel-body">
        <div id="pomo-mode" class="muted"></div><div id="pomo-time" class="pomo-time">25:00</div>
        <div class="field"><label for="pomo-subject">${esc(t('study.subject'))}</label>
          <input id="pomo-subject" list="subject-list" maxlength="80" value="${esc(pomo.subject)}"><datalist id="subject-list">${subjects.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></div>
        <div class="row">${field('pomo-focus', t('study.focus_min'), `<input id="pomo-focus" type="number" min="1" max="120" value="${pomo.focusMin}">`)}
          ${field('pomo-break', t('study.break_min'), `<input id="pomo-break" type="number" min="1" max="60" value="${pomo.breakMin}">`)}</div>
        <div class="pomo-actions"><button id="pomo-toggle" class="btn btn-primary" type="button"></button><button id="pomo-reset" class="btn" type="button">${esc(t('study.reset'))}</button></div>
        <p><small>${esc(t('study.pomo_note'))}</small></p></div></section>
      <section class="panel"><header class="panel-head"><h2>${esc(t('study.sessions'))}</h2><button id="sess-add" class="btn btn-primary btn-sm">${esc(t('study.add_session'))}</button></header>
        <div class="panel-body flush" id="sessions-list"></div></section>
    </div>`;
  $('#pomo-toggle', body).onclick = togglePomodoro;
  $('#pomo-reset', body).onclick = () => { stopPomodoro(); paint(); };
  $('#pomo-focus', body).onchange = applyDurations;
  $('#pomo-break', body).onchange = applyDurations;
  $('#sess-add', body).onclick = () => openSessionForm(null, subjects, refreshSessions);
  paint();
  await refreshSessions();
}

async function refreshSessions() {
  const body = sessionsRoot;
  if (!body || !$('#sessions-list', body)) return;
  const all = await getSessions();
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const week = all.filter((s) => s.session_date >= days[0] && s.session_date <= today);
  const perDay = days.map((d) => week.filter((s) => s.session_date === d).reduce((n, s) => n + s.actual_minutes, 0));
  const maxDay = Math.max(...perDay, 1);
  const actual = week.reduce((n, s) => n + s.actual_minutes, 0);
  const target = week.reduce((n, s) => n + s.target_minutes, 0);
  const bySubject = {};
  week.forEach((s) => { bySubject[s.subject] = (bySubject[s.subject] || 0) + s.actual_minutes; });
  const subjectRows = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);

  $('#week-summary', body).innerHTML = `
    <div class="grid grid-stats">${stat(t('study.week_actual'), esc(minutesToText(actual)))}${stat(t('study.week_target'), esc(minutesToText(target)))}
      ${stat(t('study.week_progress'), target ? `${fmtNum(Math.min(100, (actual / target) * 100))}%` : '—')}</div>
    <div class="grid grid-2">
      ${panel(t('study.week_days'), `<div class="week">${days.map((d, i) => `<div class="week-col"><span class="num">${perDay[i] ? esc(fmtNum(perDay[i])) : ''}</span><div class="week-bar" style="height:${(perDay[i] / maxDay) * 80}%"></div><span>${esc(fmtWeekday(d))}</span></div>`).join('')}</div><small>${esc(t('study.minutes_unit'))}</small>`)}
      ${panel(t('study.by_subject'), subjectRows.length ? `<div class="stack">${subjectRows.map(([s, m]) => `<div class="meter-row"><header><span>${esc(s)}</span><span class="num">${esc(minutesToText(m))}</span></header>${bar((m / actual) * 100, 'ok')}</div>`).join('')}</div>` : emptyState(t('study.no_week')))}
    </div>`;

  const box = $('#sessions-list', body);
  const recent = all.slice(0, 30);
  box.innerHTML = recent.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('tx.date'))}</th><th>${esc(t('study.subject'))}</th><th>${esc(t('study.target'))}</th><th>${esc(t('study.actual'))}</th><th></th></tr></thead><tbody>
    ${recent.map((s) => `<tr><td>${esc(fmtDate(s.session_date))}</td><td>${esc(s.subject)}</td><td class="num">${esc(minutesToText(s.target_minutes))}</td><td class="num">${esc(minutesToText(s.actual_minutes))}</td>
      <td><span class="row-actions"><button class="btn btn-ghost btn-sm" data-log="${s.id}">${esc(t('study.log_time'))}</button><button class="btn btn-ghost btn-sm" data-edit="${s.id}">${esc(t('common.edit'))}</button><button class="btn btn-ghost btn-sm" data-del="${s.id}">${esc(t('common.delete'))}</button></span></td></tr>`).join('')}
    </tbody></table></div>` : emptyState(t('study.no_sessions'));

  const subjects = [...new Set(all.map((s) => s.subject))];
  $$('[data-edit]', box).forEach((b) => (b.onclick = () => openSessionForm(all.find((s) => s.id === b.dataset.edit), subjects, refreshSessions)));
  $$('[data-log]', box).forEach((b) => (b.onclick = () => {
    const s = all.find((x) => x.id === b.dataset.log);
    openForm(t('study.log_time'), field('l-min', t('study.minutes_to_add'), `<input id="l-min" name="minutes" type="number" min="1" max="1440" required>`), async (d) => {
      const add = Math.round(Number(d.minutes));
      if (!(add >= 1 && add <= 1440)) throw new ValidationError(t('val.minutes'));
      await unwrap(supabase.from('study_sessions').update({ actual_minutes: Math.min(1440, s.actual_minutes + add) }).eq('id', s.id));
      invalidate('sessions'); toast(t('common.saved')); refreshSessions();
    });
  }));
  $$('[data-del]', box).forEach((b) => (b.onclick = async () => {
    if (!(await confirmAction(t('common.confirm_delete')))) return;
    try { await unwrap(supabase.from('study_sessions').delete().eq('id', b.dataset.del)); invalidate('sessions'); toast(t('common.deleted')); refreshSessions(); }
    catch (err) { console.error(err); toast(t('err.generic'), 'error'); }
  }));
}

function openSessionForm(s, subjects, onDone) {
  openForm(t(s ? 'study.edit_session' : 'study.add_session'), `
    ${field('s-subject', t('study.subject'), `<input id="s-subject" name="subject" list="s-subjects" maxlength="80" value="${esc(s?.subject || '')}" required><datalist id="s-subjects">${subjects.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`)}
    <div class="row">${field('s-target', t('study.target_min'), `<input id="s-target" name="target_minutes" type="number" min="0" max="1440" value="${s?.target_minutes ?? 60}" required>`)}
      ${field('s-actual', t('study.actual_min'), `<input id="s-actual" name="actual_minutes" type="number" min="0" max="1440" value="${s?.actual_minutes ?? 0}" required>`)}</div>
    ${field('s-date', t('tx.date'), `<input id="s-date" name="session_date" type="date" value="${s?.session_date || todayISO()}" required>`)}`,
  async (d) => {
    const subject = d.subject.trim();
    const target = Math.round(Number(d.target_minutes));
    const actual = Math.round(Number(d.actual_minutes));
    if (!subject || subject.length > 80) throw new ValidationError(t('val.name_len'));
    if (![target, actual].every((n) => n >= 0 && n <= 1440)) throw new ValidationError(t('val.minutes'));
    if (!d.session_date || Number.isNaN(Date.parse(d.session_date))) throw new ValidationError(t('val.date'));
    const row = { subject, target_minutes: target, actual_minutes: actual, session_date: d.session_date };
    if (s) await unwrap(supabase.from('study_sessions').update(row).eq('id', s.id));
    else await unwrap(supabase.from('study_sessions').insert({ ...row, user_id: state.user.id }));
    invalidate('sessions'); toast(t('common.saved')); onDone();
  });
}
