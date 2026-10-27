// Authentication UI and flows (Supabase Auth). No passwords are ever stored or logged by this app.
import { supabase } from './supabase-client.js';
import { redirectUrl } from './config.js';
import { t } from './i18n.js';
import { $, $$, friendlyError, isEmail } from './utils.js';

const PANELS = ['login', 'register', 'forgot', 'recovery', 'config'];

export function setAuthMessage(text, type = 'error') {
  const box = $('#auth-msg');
  box.hidden = !text;
  box.textContent = text || '';
  box.className = `notice ${type}`;
}

export function showAuthPanel(name) {
  setAuthMessage('');
  PANELS.forEach((p) => { const el = $(`[data-panel="${p}"]`); if (el) el.hidden = p !== name; });
  $('#auth-tabs').hidden = !['login', 'register'].includes(name);
  $$('#auth-tabs [data-auth-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.authTab === name)));
}

function validatePassword(password, confirm) {
  if (password.length < 8) return t('val.password_len');
  if (password !== confirm) return t('val.password_match');
  return '';
}

/** Wraps a submit handler: disables the button, shows friendly errors. */
function bindForm(id, handler) {
  const form = $(id);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('[type=submit]', form);
    button.disabled = true;
    setAuthMessage('');
    try {
      await handler(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      setAuthMessage(friendlyError(err));
    } finally {
      button.disabled = false;
    }
  });
}

export function initAuthUI({ onRecoverySubmit }) {
  $$('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => showAuthPanel(b.dataset.authTab)));

  bindForm('#form-login', async ({ email, password }) => {
    if (!isEmail(email.trim())) return setAuthMessage(t('val.email'));
    if (!password) return setAuthMessage(t('val.required'));
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    // The auth listener in app.js takes over once the session exists.
  });

  bindForm('#form-register', async ({ display_name, email, password, confirm }, form) => {
    const name = display_name.trim();
    if (!name || name.length > 60) return setAuthMessage(t('val.name_len'));
    if (!isEmail(email.trim())) return setAuthMessage(t('val.email'));
    const problem = validatePassword(password, confirm);
    if (problem) return setAuthMessage(problem);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { display_name: name }, emailRedirectTo: redirectUrl() },
    });
    if (error) throw error;
    if (data.user && data.user.identities && data.user.identities.length === 0) return setAuthMessage(t('err.exists'));
    if (!data.session) {                      // email confirmation is enabled
      form.reset();
      showAuthPanel('login');
      setAuthMessage(t('auth.check_email'), 'success');
    }
  });

  bindForm('#form-forgot', async ({ email }, form) => {
    if (!isEmail(email.trim())) return setAuthMessage(t('val.email'));
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
    if (error) throw error;
    form.reset();
    setAuthMessage(t('auth.reset_sent'), 'success');   // same message whether or not the account exists
  });

  bindForm('#form-recovery', async ({ password, confirm }) => {
    const problem = validatePassword(password, confirm);
    if (problem) return setAuthMessage(problem);
    await onRecoverySubmit(password);
  });
}

export const updatePassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

/**
 * Logout. The browser can only *report* it; the database stores it with
 * source = 'client' so admins can tell it apart from server-verified events.
 */
export async function signOut() {
  try { await supabase.rpc('log_client_event', { p_event: 'logout', p_details: {} }); } catch { /* never block logout */ }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
