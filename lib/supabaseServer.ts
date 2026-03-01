import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client - ONLY for server-side API routes (never import in client code)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseService = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type SupabaseService = typeof supabaseService;
