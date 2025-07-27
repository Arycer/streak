import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Debug logging
console.log('Supabase Config:', {
  url: supabaseUrl ? 'URL configured' : 'URL missing',
  key: supabaseAnonKey ? 'Key configured' : 'Key missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
