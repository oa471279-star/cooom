// Creates the single Supabase client used by every module.
// The UMD build of supabase-js is loaded in index.html and exposes window.supabase.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, isConfigured } from './config.js';

export const supabase = isConfigured()
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
