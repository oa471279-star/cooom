// Shared helpers: DOM, formatting, dialogs, toasts, error mapping, small HTML builders.
import { t, getLocale } from './i18n.js';
import { DEFAULT_CURRENCY } from './config.js';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Escape any text before putting it into innerHTML (prevents XSS from user content). */
export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class ValidationError extends Error {}

/* ---------- Local preferences (theme, currency). Never financial data. ---------- */
const PREF_KEY = 'balance.prefs';
export function getPref(key, fallback) {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}')[key] ?? fallback; } catch { return fallback; }
}
export function setPref(key, value) {
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { /* ignore */ }
  prefs[key] = value;
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

/* ---------- Dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function monthsBack(count, today = todayISO()) {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}
const dateOf = (v) => new Date(v.length <= 10 ? `${v}T00:00:00` : v);
export const fmtDate = (v) => (v ? new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'short', day: 'numeric' }).format(dateOf(v)) : '—');
export const fmtDateTime = (v) => (v ? new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(dateOf(v)) : '—');
export const fmtMonth = (key) => new Intl.DateTimeFormat(getLocale(), { month: 'short', year: '2-digit' }).format(new Date(`${key}-01T00:00:00`));
export const fmtWeekday = (iso) => new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(dateOf(iso));
export const fmtTime = (hhmm) => (hhmm ? hhmm.slice(0, 5) : '');

/* ---------- Numbers & money ---------- */
export const fmtNum = (n, max = 0) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: max }).format(n || 0);
export const money = (n) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: getPref('currency', DEFAULT_CURRENCY), maximumFractionDigits: 2 }).format(n || 0);
export function minutesToText(minutes) {
  const m = Math.round(minutes || 0);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return h ? `${fmtNum(h)}${t('unit.h')} ${fmtNum(rest)}${t('unit.m')}` : `${fmtNum(rest)}${t('unit.m')}`;
}

/* ---------- Validation ---------- */
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const escapeLike = (v) => v.replace(/[\\%_]/g, (c) => `\\${c}`);
export const debounce = (fn, ms = 250) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; };

/* ---------- Errors ---------- */
export function friendlyError(err) {
  console.error(err);
  const m = String(err?.message || err || '').toLowerCase();
  if (m.includes('invalid login')) return t('err.invalid_login');
  if (m.includes('email not confirmed')) return t('err.email_not_confirmed');
  if (m.includes('already registered')) return t('err.exists');
  if (m.includes('rate limit') || m.includes('too many')) return t('err.rate');
  if (m.includes('failed to fetch') || m.includes('network')) return t('err.network');
  if (m.includes('different from the old')) return t('err.same_password');
  if (m.includes('password should') || m.includes('weak')) return t('err.weak_password');
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('not authorized') || m.includes('protected profile')) return t('err.permission');
  return t('err.generic');
}

/* ---------- Feedback UI ---------- */
export function toast(message, type = 'success') {
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.setAttribute('role', type === 'error' ? 'alert' : 'status');
  node.textContent = message;
  $('#toasts').append(node);
  setTimeout(() => node.remove(), type === 'error' ? 6000 : 3500);
}

export function confirmAction(message) {
  return new Promise((resolve) => {
    const dlg = $('#confirm');
    $('#confirm-msg').textContent = message;
    dlg.returnValue = '';
    dlg.onclose = () => resolve(dlg.returnValue === 'ok');
    dlg.showModal();
    $('button[value="cancel"]', dlg).focus();
  });
}

/** Opens the shared modal with a form. `onSubmit(data, form)` may throw ValidationError or a DB error. */
export function openForm(title, fieldsHtml, onSubmit) {
  const dlg = $('#modal');
  dlg.innerHTML = `<form novalidate><h2>${esc(title)}</h2>${fieldsHtml}
    <p class="form-error" role="alert"></p>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>${esc(t('common.cancel'))}</button>
    <button type="submit" class="btn btn-primary">${esc(t('common.save'))}</button></div></form>`;
  const form = $('form', dlg);
  const errBox = $('.form-error', form);
  $('[data-close]', form).onclick = () => dlg.close();
  form.onsubmit = async (event) => {
    event.preventDefault();
    errBox.textContent = '';
    const submit = $('[type=submit]', form);
    submit.disabled = true;
    try {
      await onSubmit(Object.fromEntries(new FormData(form)), form);
      dlg.close();
    } catch (ex) {
      errBox.textContent = ex instanceof ValidationError ? ex.message : friendlyError(ex);
    } finally {
      submit.disabled = false;
    }
  };
  dlg.showModal();
  $('input, select, textarea', form)?.focus();
  return form;
}

/* ---------- Small HTML builders (all inputs are escaped) ---------- */
export const badge = (text, kind = 'neutral') => `<span class="badge badge-${kind}">${esc(text)}</span>`;
export const bar = (pct, level = 'ok') => {
  const w = Math.min(Math.max(pct || 0, 0), 100);
  return `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(w)}"><span class="bar-fill ${level}" style="width:${w}%"></span></div>`;
};
export const emptyState = (message, action = '') => `<div class="empty"><p>${esc(message)}</p>${action}</div>`;
export const panel = (title, body, extra = '', flush = false) =>
  `<section class="panel"><header class="panel-head"><h2>${esc(title)}</h2>${extra}</header><div class="panel-body${flush ? ' flush' : ''}">${body}</div></section>`;
export const field = (id, label, control, hint = '') =>
  `<div class="field"><label for="${id}">${esc(label)}</label>${control}${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
export const options = (items, selected, labelOf) =>
  items.map((v) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(labelOf(v))}</option>`).join('');
export const stat = (label, value, cls = '', note = '') =>
  `<div class="stat"><span class="stat-label">${esc(label)}</span><strong class="stat-value ${cls}">${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
export const levelOf = (pct) => (pct > 100 ? 'over' : pct >= 80 ? 'warn' : 'ok');

export function pagerHtml(page, pages, total) {
  return `<div class="pager"><span class="muted">${esc(t('common.page_of', { p: fmtNum(page), n: fmtNum(pages) }))} · ${esc(t('common.total_n', { n: fmtNum(total) }))}</span>
    <span class="row-actions"><button type="button" class="btn btn-sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${esc(t('common.prev'))}</button>
    <button type="button" class="btn btn-sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>${esc(t('common.next'))}</button></span></div>`;
}
