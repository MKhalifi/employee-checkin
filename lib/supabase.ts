import { createClient } from '@supabase/supabase-js';

// Client pour le frontend (lecture seule ou actions publiques)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);