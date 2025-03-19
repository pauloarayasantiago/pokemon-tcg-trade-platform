import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options) {
            // This is a no-op because we handle setting cookies in the response
          },
          remove(name: string, options) {
            // This is a no-op because we handle removing cookies in the response
          },
        },
      }
    );

    // Refresh session if expired
    await supabase.auth.getSession();

    // Process the request regardless of auth state
    return NextResponse.next();
  } catch (e) {
    // Handle any errors
    console.error('Middleware error:', e);
    return NextResponse.next();
  }
}

// Apply middleware to all routes
export const config = {
  matcher: [
    // Exclude static files, api routes, and public routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 