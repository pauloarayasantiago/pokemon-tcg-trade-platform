import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export default async function createApiSupabaseClient() {
  // In Next.js 15, cookies() is async, but the auth-helpers package expects the old pattern
  // Store cookies first to avoid calling .get() directly on cookies()
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
} 