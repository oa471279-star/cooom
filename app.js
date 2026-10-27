// Application bootstrap: session handling, routing, global controls.
import { supabase } from './supabase-client.js';
import { INITIAL_HASH, isConfigured } from './config.js';
import { t, getLang, setLang } from './i18n.js';
import { $, $$, toast, friendlyError, getPref, setPref, panel, emptyState } from './utils.js';
import { state, invalidate, unwrap } from './data.js';
import { initAuthUI, showAuthPanel, setAuthMessage, signOut, updatePassword } from './auth.js';
import { renderDashboard } from './dashboard.js';
import { renderTransactions } from './transactions.js';
import { renderBudgets } from './budgets.js';
import { renderStudy, stopPomodoro } from './study.js';
import { renderDaily } from './daily.js';
import { renderReports } from './reports.js';
import { renderSettings } from './settings.js';
import { renderAdmin } from './admin.js';
import { destroyCharts } from './charts.js';

const routes = {
  dashboard: { title: 'nav.dashboard', render: renderDashboard },
  money: { title: 'nav.money', render: renderTransactions },
  budgets: { title: 'nav.budgets', render: renderBudgets },
  study: { title: 'nav.study', render: renderStudy },
  daily: { title: 'nav.daily', render: renderDaily },
  reports: { title: 'nav.reports', render: renderReports },
  settings: { title: 'nav.settings', render: renderSettings },
  admin: { title: 'nav.admin', render: renderAdmin },
};

// Details of the link the visitor arrived with (email confirmation / password recovery).
const hashParams = new URLSearchParams(INITIAL_HASH.replace(/^#/, ''));
let recovering = hashParams.get('type') === 'recovery';
let linkError = hashParams.get('error_description');
let renderToken = 0;

/* ---------------- Screens ---------------- */
function showScreen(name) {
  $('#boot').hidden = true;
  $('#auth-screen').hidden = name !== 'auth';
  $('#app').hidden = name !== 'app';
}

function applyTheme() { document.documentElement.dataset.theme = getPref('theme', 'light'); }

function updateChrome() {
  $('#btn-lang span').textContent = getLang() === 'ar' ? 'English' : 'العربية';
  $('#auth-lang').textContent = getLang() === 'ar' ? 'English' : 'العربية';
  $('#btn-theme span').textContent = t(getPref('theme', 'light') === 'dark' ? 'settings.light' : 'settings.dark');
  if (state.profile) {
    $('#user-chip').textContent = state.profile.display_name || state.profile.email;
    $('#nav-admin').hidden = state.profile.role !== 'admin';
  }
}

/* ---------------- Routing ---------------- */
async function renderRoute() {
  if (!state.user) return;
  const match = location.hash.match(/^#\/(\w+)/);
  let name = match ? match[1] : 'dashboard';
  if (!routes[name]) name = 'dashboard';
  if (name === 'admin' && state.profile?.role !== 'admin') { location.hash = '#/dashboard'; return; }

  const route = routes[name];
  const token = ++renderToken;
  $$('#nav a').forEach((a) => (a.dataset.route === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  $('#page-title').textContent = t(route.title);
  document.title = `${t(route.title)} · Balance`;
  closeMenu();

  const view = $('#view');
  destroyCharts();
  // Each navigation gets its own container, so a slow, stale render can never overwrite a newer view.
  const holder = document.createElement('div');
  holder.innerHTML = `<p class="muted" role="status">${t('common.loading')}</p>`;
  view.replaceChildren(holder);
  try {
    await route.render(holder);
  } catch (err) {
    if (token !== renderToken) return;
    holder.innerHTML = panel(t('common.error'), emptyState(friendlyError(err), `<button class="btn" id="retry">${t('common.retry')}</button>`));
    $('#retry').onclick = renderRoute;
  }
}

function closeMenu() {
  $('#sidebar').classList.remove('open');
  $('#scrim').hidden = true;
  $('#btn-menu').setAttribute('aria-expanded', 'false');
}
function toggleMenu() {
  const open = !$('#sidebar').classList.contains('open');
  $('#sidebar').classList.toggle('open', open);
  $('#scrim').hidden = !open;
  $('#btn-menu').setAttribute('aria-expanded', String(open));
}

/* ---------------- Session handling ---------------- */
async function onSignedIn(user) {
  if (state.user?.id === user.id) return;       // token refresh etc.
  try {
    state.profile = await unwrap(supabase.from('profiles').select('*').eq('id', user.id).single());
  } catch (err) {
    showScreen('auth'); showAuthPanel('login');
    setAuthMessage(t('err.profile_missing'));
    await supabase.auth.signOut();
    return;
  }
  state.user = user;
  invalidate();
  showScreen('app');
  updateChrome();
  if (!location.hash.startsWith('#/')) location.hash = '#/dashboard'; // fires hashchange → renderRoute
  else renderRoute();
}

function onSignedOut() {
  state.user = null; state.profile = null;
  invalidate(); stopPomodoro(); destroyCharts();
  history.replaceState(null, '', location.pathname);
  showScreen('auth');
  showAuthPanel(recovering ? 'recovery' : 'login');
  if (linkError) { setAuthMessage(t('err.link_expired')); linkError = null; }
}

function handleAuthEvent(event, session) {
  if (event === 'PASSWORD_RECOVERY' || (recovering && session)) {
    recovering = true;
    state.user = null;
    showScreen('auth'); showAuthPanel('recovery');
    return;
  }
  if (session) onSignedIn(session.user);
  else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') onSignedOut();
}

/* ---------------- Boot ---------------- */
function bindGlobalControls() {
  const switchLang = () => setLang(getLang() === 'ar' ? 'en' : 'ar');
  $('#btn-lang').onclick = switchLang;
  $('#auth-lang').onclick = switchLang;
  $('#btn-theme').onclick = () => { setPref('theme', getPref('theme', 'light') === 'dark' ? 'light' : 'dark'); applyTheme(); updateChrome(); renderRoute(); };
  $('#btn-logout').onclick = async () => { try { await signOut(); } catch (err) { toast(friendlyError(err), 'error'); } };
  $('#btn-menu').onclick = toggleMenu;
  $('#scrim').onclick = closeMenu;
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('balance:langchange', () => { updateChrome(); renderRoute(); });
  window.addEventListener('balance:profilechange', updateChrome);
  window.addEventListener('balance:themechange', () => { applyTheme(); updateChrome(); renderRoute(); });
}

async function boot() {
  applyTheme();
  setLang(getLang());
  bindGlobalControls();
  if (!isConfigured()) { showScreen('auth'); showAuthPanel('config'); return; }

  initAuthUI({
    onRecoverySubmit: async (password) => {
      recovering = false;                        // must be cleared before USER_UPDATED fires
      try { await updatePassword(password); } catch (err) { recovering = true; throw err; }
      toast(t('auth.password_updated'));
      const { data } = await supabase.auth.getSession();
      if (data.session) onSignedIn(data.session.user);
    },
  });
  // Do not await Supabase calls inside this callback (can deadlock); defer instead.
  supabase.auth.onAuthStateChange((event, session) => setTimeout(() => handleAuthEvent(event, session), 0));
}

boot();
