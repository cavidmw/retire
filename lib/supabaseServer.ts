import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Service-role client - ONLY for server-side API routes (never import in client code)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !serviceKey) {
  console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseService: SupabaseClient = createClient(url || 'https://placeholder.supabase.co', serviceKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type SupabaseService = typeof supabaseService;
