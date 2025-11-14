import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Please ensure the following are set in your .env.local file:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
      'Refer to docs/DATABASE.md for setup instructions.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testSupabaseConnection() {
  try {
    const result = await supabase.from('pg_stat_statements').select('count(*)').limit(1);
    return {
      success: !result.error,
      error: result.error?.message || null,
      message: 'Connected to Supabase successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      message: 'Failed to connect to Supabase',
    };
  }
}

export default supabase;
