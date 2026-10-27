// Settings: profile, language, theme, currency and password.
import { supabase } from './supabase-client.js';
import { t, getLang, setLang } from './i18n.js';
import { CURRENCIES, DEFAULT_CURRENCY } from './config.js';
import { $, esc, fmtDate, toast, field, options, panel, badge, getPref, setPref, friendlyError, ValidationError } from './utils.js';
import { state, unwrap } from './data.js';
import { updatePassword } from './auth.js';

export async function renderSettings(root) {
  const p = state.profile;
  root.innerHTML = `
    <div class="grid grid-2">
      ${panel(t('settings.profile'), `
        <ul class="list"><li><span>${esc(t('auth.email'))}</span><strong dir="ltr">${esc(p.email)}</strong></li>
        <li><span>${esc(t('settings.role'))}</span>${badge(t(`settings.role_${p.role}`), p.role === 'admin' ? 'green' : 'neutral')}</li>
        <li><span>${esc(t('settings.created'))}</span><strong>${esc(fmtDate(p.created_at))}</strong></li></ul>
        <form id="form-name" novalidate style="margin-top:1rem">
          ${field('set-name', t('auth.display_name'), `<input id="set-name" name="name" maxlength="60" value="${esc(p.display_name)}" required>`)}
          <p class="form-error" role="alert" id="name-err"></p>
          <button class="btn btn-primary" type="submit">${esc(t('common.save'))}</button></form>`)}
      ${panel(t('settings.preferences'), `
        ${field('set-lang', t('settings.language'), `<select id="set-lang"><option value="ar"${getLang() === 'ar' ? ' selected' : ''}>العربية</option><option value="en"${getLang() === 'en' ? ' selected' : ''}>English</option></select>`)}
        ${field('set-theme', t('settings.theme'), `<select id="set-theme">${options(['light', 'dark'], getPref('theme', 'light'), (v) => t(`settings.${v}`))}</select>`)}
        ${field('set-cur', t('settings.currency'), `<select id="set-cur">${options(CURRENCIES, getPref('currency', DEFAULT_CURRENCY), (v) => v)}</select>`, t('settings.local_note'))}`)}
    </div>
    ${panel(t('settings.security'), `
      <form id="form-pass" novalidate style="max-width:420px">
        ${field('set-pass', t('auth.new_password'), `<input id="set-pass" name="password" type="password" autocomplete="new-password" minlength="8" dir="ltr" required>`, t('auth.password_hint'))}
        ${field('set-pass2', t('auth.confirm_password'), `<input id="set-pass2" name="confirm" type="password" autocomplete="new-password" dir="ltr" required>`)}
        <p class="form-error" role="alert" id="pass-err"></p>
        <button class="btn btn-primary" type="submit">${esc(t('settings.change_password'))}</button></form>`)}`;

  $('#form-name', root).onsubmit = async (e) => {
    e.preventDefault();
    const name = $('#set-name', root).value.trim();
    const err = $('#name-err', root);
    err.textContent = '';
    if (!name || name.length > 60) { err.textContent = t('val.name_len'); return; }
    try {
      await unwrap(supabase.from('profiles').update({ display_name: name }).eq('id', state.user.id));
      state.profile.display_name = name;
      window.dispatchEvent(new Event('balance:profilechange'));
      toast(t('common.saved'));
    } catch (ex) { err.textContent = friendlyError(ex); }
  };

  $('#form-pass', root).onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#pass-err', root);
    err.textContent = '';
    const pw = $('#set-pass', root).value;
    if (pw.length < 8) { err.textContent = t('val.password_len'); return; }
    if (pw !== $('#set-pass2', root).value) { err.textContent = t('val.password_match'); return; }
    try { await updatePassword(pw); e.target.reset(); toast(t('auth.password_updated')); }
    catch (ex) { err.textContent = friendlyError(ex); }
  };

  $('#set-lang', root).onchange = (e) => setLang(e.target.value);
  $('#set-theme', root).onchange = (e) => { setPref('theme', e.target.value); window.dispatchEvent(new Event('balance:themechange')); };
  $('#set-cur', root).onchange = (e) => { setPref('currency', e.target.value); toast(t('common.saved')); };
}
