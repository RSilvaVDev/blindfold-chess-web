import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';

let client: SupabaseClient | undefined;

// One client per tab. It stores the session in localStorage and refreshes the
// access token before it expires, so API calls always get a current token.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const { supabaseUrl, supabasePublishableKey } = getEnv();
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
