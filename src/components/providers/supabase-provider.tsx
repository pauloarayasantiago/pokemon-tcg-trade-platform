'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import createBrowserSupabaseClient from '@/lib/supabase-browser';

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null;
};

const Context = createContext<SupabaseContext>({ supabase: null });

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context.supabase;
}; 