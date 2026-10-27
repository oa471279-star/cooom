// Admin dashboard. Everything here is also enforced by RLS / SECURITY DEFINER functions in the database;
// hiding the menu entry is only a convenience. Admins see account metadata and counts — never private finances.
import { supabase } from './supabase-client.js';
import { t } from './i18n.js';
import { PAGE_SIZE } from './config.js';
import { $, $$, esc, fmtDate, fmtDateTime, fmtNum, panel, emptyState, badge, stat, field, options, pagerHtml, escapeLike, addDays, todayISO } from './utils.js';
import { state, unwrap } from './data.js';

let tab = 'users';
const lf = { email: '', type: '', from: '', to: '', page: 1 };
let userSearch = '';

export async function renderAdmin(root) {
  if (state.profile?.role !== 'admin') { root.innerHTML = emptyState(t('admin.forbidden')); return; }
  root.innerHTML = `
    <div class="tabs" role="tablist">
      <button role="tab" data-tab="users" aria-selected="${tab === 'users'}">${esc(t('admin.users'))}</button>
      <button role="tab" data-tab="activity" aria-selected="${tab === 'activity'}">${esc(t('admin.activity'))}</button>
    </div><div id="admin-body"></div>`;
  $$('[data-tab]', root).forEach((b) => (b.onclick = () => { tab = b.dataset.tab; renderAdmin(root); }));
  const body = $('#admin-body', root);
  if (tab === 'users') await renderUsers(body); else await renderActivity(body);
}

async function renderUsers(body) {
  const users = await unwrap(supabase.rpc('admin_user_summary'));
  const weekAgo = addDays(todayISO(), -7);
  body.innerHTML = `
    <div class="grid grid-stats">${stat(t('admin.total_users'), esc(fmtNum(users.length)))}
      ${stat(t('admin.admins'), esc(fmtNum(users.filter((u) => u.role === 'admin').length)))}
      ${stat(t('admin.new_week'), esc(fmtNum(users.filter((u) => u.created_at.slice(0, 10) >= weekAgo).length)))}</div>
    <p class="notice">${esc(t('admin.privacy_note'))}</p>
    <div class="toolbar">${field('u-search', t('common.search'), `<input id="u-search" type="search" value="${esc(userSearch)}" placeholder="${esc(t('admin.user_search_ph'))}">`)}</div>
    <section class="panel"><div class="panel-body flush" id="users-table"></div></section>
    <p><small>${esc(t('admin.online_note'))}</small></p>`;
  const draw = () => {
    const q = userSearch.trim().toLowerCase();
    const rows = users.filter((u) => !q || u.email.toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q));
    $('#users-table', body).innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr>
      <th>${esc(t('auth.email'))}</th><th>${esc(t('auth.display_name'))}</th><th>${esc(t('settings.role'))}</th><th>${esc(t('settings.created'))}</th>
      <th>${esc(t('admin.last_login'))}</th><th>${esc(t('admin.logins'))}</th><th>${esc(t('admin.tx_count'))}</th><th>${esc(t('admin.task_count'))}</th></tr></thead><tbody>
      ${rows.map((u) => `<tr><td dir="ltr">${esc(u.email)}</td><td>${esc(u.display_name) || '—'}</td><td>${badge(t(`settings.role_${u.role}`), u.role === 'admin' ? 'green' : 'neutral')}</td>
        <td>${esc(fmtDate(u.created_at))}</td><td>${esc(fmtDateTime(u.last_sign_in_at))}</td><td class="num">${esc(fmtNum(u.login_count))}</td>
        <td class="num">${esc(fmtNum(u.transaction_count))}</td><td class="num">${esc(fmtNum(u.task_count))}</td></tr>`).join('')}</tbody></table></div>` : emptyState(t('admin.no_users'));
  };
  $('#u-search', body).oninput = (e) => { userSearch = e.target.value; draw(); };
  draw();
}

async function renderActivity(body) {
  body.innerHTML = `
    <form class="toolbar" id="log-filters"><div class="row">
      ${field('l-email', t('admin.user'), `<input id="l-email" type="search" value="${esc(lf.email)}" placeholder="${esc(t('admin.user_search_ph'))}">`)}
      ${field('l-type', t('admin.event'), `<select id="l-type"><option value="">${esc(t('common.all'))}</option>${options(['signup', 'login', 'logout'], lf.type, (v) => t(`admin.ev_${v}`))}</select>`)}
      ${field('l-from', t('common.from'), `<input id="l-from" type="date" value="${lf.from}">`)}
      ${field('l-to', t('common.to'), `<input id="l-to" type="date" value="${lf.to}">`)}
      <button class="btn btn-primary" type="submit">${esc(t('common.apply'))}</button>
      <button class="btn btn-ghost" type="button" id="l-reset">${esc(t('common.reset'))}</button></div></form>
    <p><small>${esc(t('admin.source_note'))}</small></p>
    <section class="panel"><div class="panel-body flush" id="log-table"></div></section>`;
  $('#log-filters', body).onsubmit = (e) => {
    e.preventDefault();
    Object.assign(lf, { email: $('#l-email', body).value.trim(), type: $('#l-type', body).value, from: $('#l-from', body).value, to: $('#l-to', body).value, page: 1 });
    loadLogs(body);
  };
  $('#l-reset', body).onclick = () => { Object.assign(lf, { email: '', type: '', from: '', to: '', page: 1 }); renderActivity(body); };
  await loadLogs(body);
}

async function loadLogs(body) {
  const from = (lf.page - 1) * PAGE_SIZE;
  let query = supabase.from('activity_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (lf.email) query = query.ilike('email', `%${escapeLike(lf.email)}%`);
  if (lf.type) query = query.eq('event_type', lf.type);
  if (lf.from) query = query.gte('created_at', new Date(`${lf.from}T00:00:00`).toISOString());
  if (lf.to) query = query.lte('created_at', new Date(`${lf.to}T23:59:59.999`).toISOString());
  const { data, error, count } = await query;
  if (error) throw error;

  const box = $('#log-table', body);
  if (!data.length) { box.innerHTML = emptyState(t('admin.no_logs')); return; }
  const kinds = { signup: 'green', login: 'neutral', logout: 'warn' };
  const detailText = (d) => Object.entries(d || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>${esc(t('admin.time'))}</th><th>${esc(t('admin.event'))}</th><th>${esc(t('admin.user'))}</th><th>${esc(t('admin.source'))}</th><th>${esc(t('admin.details'))}</th></tr></thead><tbody>
    ${data.map((l) => `<tr><td>${esc(fmtDateTime(l.created_at))}</td><td>${badge(t(`admin.ev_${l.event_type}`), kinds[l.event_type])}</td>
      <td dir="ltr">${esc(l.email || '—')}<br><small>${esc((l.user_id || '').slice(0, 8))}</small></td>
      <td>${l.source === 'server' ? badge(t('admin.src_server'), 'green') : badge(t('admin.src_client'), 'warn')}</td><td><small>${esc(detailText(l.details))}</small></td></tr>`).join('')}
    </tbody></table></div>${pagerHtml(lf.page, pages, count)}`;
  $$('[data-page]', box).forEach((b) => (b.onclick = () => { lf.page = Number(b.dataset.page); loadLogs(body); }));
}
