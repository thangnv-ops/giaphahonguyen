import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom fetch with 25-second timeout to prevent infinite hangs on Supabase free tier cold starts.
// Cold starts affect the Auth and PostgREST services independently from the DB (SQL Editor uses direct connection).
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Yêu cầu hết thời gian chờ. Supabase đang khởi động — vui lòng thử lại sau vài giây.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// No-op lock: bypasses Navigator LockManager to avoid 10s lock timeout errors
// caused by @supabase/ssr holding the Web Lock across hot-reload / multiple tabs.
// Safe for single-tab apps where concurrent token refreshes are rare.
const noopLock = async <T>(_name: string, _timeout: number, fn: () => Promise<T>): Promise<T> => fn();

// Browser client uses cookies (shared with proxy)
// Falls back to basic client during build when env vars are missing
const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      auth: { lock: noopLock },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export { supabase };

// Server-side client with service role (for admin operations)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}
