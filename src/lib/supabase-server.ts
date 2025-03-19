'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Create a Supabase client for server components
export async function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

// Default export for backward compatibility
export default createServerSupabaseClient; 