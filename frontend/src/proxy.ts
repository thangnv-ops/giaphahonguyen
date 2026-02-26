/**
 * @project AncestorTree
 * @file src/proxy.ts
 * @description Auth proxy for protected routes — Next.js 16 convention
 * @version 1.2.0
 * @updated 2026-02-26
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
// All main app routes require authentication to protect personal data.
// Unauthenticated requests to these paths are redirected to /login.
const authRequiredPaths = [
  '/',
  '/people', '/tree', '/directory', '/events',
  '/achievements', '/charter', '/cau-duong', '/contributions',
  '/documents', '/fund', '/admin',
];
const shouldLogSupabase = process.env.SUPABASE_DEBUG_LOG === '1';

function logSupabase(event: string, data: Record<string, unknown>) {
  if (!shouldLogSupabase) return;
  console.log(`[supabase][${event}]`, data);
}

function isProtectedPath(pathname: string): boolean {
  return authRequiredPaths.some((path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() can hang on Supabase free tier cold start.
  // Race with a 5-second timeout: on timeout treat user as unauthenticated
  // so public pages always load, and protected pages redirect to /login.
  let user: { id: string } | null = null;
  const authStartMs = Date.now();
  try {
    const result = await Promise.race([
      supabase.auth.getUser().then(r => r.data.user),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
    ]);
    user = result;
    logSupabase('auth.getUser.ok', {
      path: pathname,
      hasUser: Boolean(user),
      durationMs: Date.now() - authStartMs,
    });
  } catch {
    user = null;
    logSupabase('auth.getUser.error', {
      path: pathname,
      durationMs: Date.now() - authStartMs,
    });
  }

  // Redirect unauthenticated users from protected pages
  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require admin or editor role
  if (user && pathname.startsWith('/admin')) {
    const profileStartMs = Date.now();
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      logSupabase('db.profiles.select.ok', {
        path: pathname,
        role: profile?.role ?? null,
        durationMs: Date.now() - profileStartMs,
      });

      if (profile?.role !== 'admin' && profile?.role !== 'editor') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      logSupabase('db.profiles.select.error', {
        path: pathname,
        durationMs: Date.now() - profileStartMs,
      });
      // On timeout/error, deny access to admin
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Avoid redirect ping-pong on Vercel:
  // protected route -> /login?redirect=... then auth page -> /
  // can loop when server-side auth state is temporarily inconsistent.
  const hasRedirectParam = request.nextUrl.searchParams.has('redirect');
  if (user && !hasRedirectParam && publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
