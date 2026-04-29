import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmjxssklybzszqxdqsst.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_hj_wEssmOu_e9CUMLcNZfg_KZaTCbf2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
