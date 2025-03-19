'use server';

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Create a Supabase client using the direct approach
 * which is compatible with Next.js 15
 */
export async function createSSRSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
} 