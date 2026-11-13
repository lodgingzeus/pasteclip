// Publishable browser configuration, not database credentials or a secret key.
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://fgogstxisvrdbpalpdkr.supabase.co';
export const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_h0szEQfEuBm-ozMEx9m6Vg_HauLFIPI';
