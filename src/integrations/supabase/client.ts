import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// HARDcoded values to prevent "undefined" at runtime
// These are public (publishable) keys — safe to embed in client-side code
const SUPABASE_URL = 'https://gdkqetzkhgllwbpmqmux.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YDrTeXRNJE3gjCUllpOlPQ_ufbER3o5';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
