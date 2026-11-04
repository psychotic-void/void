import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ejzylwggpaqlynngllib.supabase.co';
const supabaseKey = 'sb_publishable_Gow4PNCujSp3U93Wm4sghA_4CZsoHSE';
export const supabase = createClient(supabaseUrl, supabaseKey);