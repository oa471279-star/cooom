// ---------------------------------------------------------------------------
// Balance — public configuration
// Only the project URL and the *publishable / anon* key belong here.
// NEVER put a service_role or secret key in frontend code.
// ---------------------------------------------------------------------------

// Captured immediately: Supabase clears the URL hash after it processes an
// auth redirect (email confirmation / password recovery), and we need to know
// what the link contained.
export const INITIAL_HASH = window.location.hash;

export const SUPABASE_URL = 'https://nlakqvnbrtviwcijikdx.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uWIjc7PuMnwmMvX2q-qLEg_DBmFlfOI';

export const DEFAULT_CURRENCY = 'EGP';
export const CURRENCIES = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'];
export const PAGE_SIZE = 15;

/** True once the placeholders above have been replaced. */
export const isConfigured = () =>
  !SUPABASE_URL.includes('YOUR-') && !SUPABASE_PUBLISHABLE_KEY.includes('YOUR-');

/** Redirect target for auth emails; works under a GitHub Pages sub-path. */
export const redirectUrl = () => window.location.origin + window.location.pathname;
