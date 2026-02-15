import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

const supabaseConfig = getSupabaseConfig();

export const supabase: SupabaseClient | null = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

export const isSupabaseConfigured = (): boolean => supabase !== null;
