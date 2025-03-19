/**
 * Simple re-export of the browser Supabase client
 * This allows for simpler imports throughout the application
 */
import createBrowserSupabaseClient from './supabase-browser';

const supabase = createBrowserSupabaseClient();

export default supabase; 