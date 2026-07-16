/**
 * @project AncestorTree
 * @file src/lib/supabase-desktop-auth.ts
 * @description Mock auth for desktop mode — single-user admin, no login required.
 *              Mimics Supabase Auth API surface used by AuthProvider + middleware.
 * @version 1.0.0
 * @updated 2026-02-26
 */

export const DESKTOP_USER_ID = '00000000-0000-0000-0000-000000000001';

const DESKTOP_USER = {
  id: DESKTOP_USER_ID,
  email: 'admin@desktop.local',
  app_metadata: {},
  user_metadata: { full_name: 'Admin' },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DESKTOP_SESSION = {
  access_token: 'desktop-mock-token',
  refresh_token: 'desktop-mock-refresh',
  expires_in: 99999999,
  expires_at: Math.floor(Date.now() / 1000) + 99999999,
  token_type: 'bearer' as const,
  user: DESKTOP_USER,
};

type AuthCallback = (event: string, session: typeof DESKTOP_SESSION | null) => void;

/** Subscriptions returned by onAuthStateChange */
class DesktopSubscription {
  private _unsub: () => void;
  constructor(unsub: () => void = () => {}) {
    this._unsub = unsub;
  }
  unsubscribe() {
    this._unsub();
  }
}

export function createDesktopAuth() {
  const listeners: Set<AuthCallback> = new Set();

  return {
    getSession() {
      return Promise.resolve({
        data: { session: DESKTOP_SESSION },
        error: null,
      });
    },

    getUser() {
      return Promise.resolve({
        data: { user: DESKTOP_USER },
        error: null,
      });
    },

    signInWithPassword(_credentials: { email: string; password: string }) {
      // Fire SIGNED_IN so AuthProvider picks up the session
      setTimeout(() => {
        listeners.forEach((cb) => cb('SIGNED_IN', DESKTOP_SESSION));
      }, 0);
      return Promise.resolve({
        data: { user: DESKTOP_USER, session: DESKTOP_SESSION },
        error: null,
      });
    },

    signUp(_credentials: { email: string; password: string; options?: { data?: Record<string, string> } }) {
      setTimeout(() => {
        listeners.forEach((cb) => cb('SIGNED_IN', DESKTOP_SESSION));
      }, 0);
      return Promise.resolve({
        data: { user: DESKTOP_USER, session: DESKTOP_SESSION },
        error: null,
      });
    },

    signOut() {
      // Fire SIGNED_OUT so AuthProvider clears user state (like real Supabase).
      // User can log back in via /login — shim accepts any credentials.
      setTimeout(() => {
        listeners.forEach((cb) => cb('SIGNED_OUT', null));
      }, 0);
      return Promise.resolve({ error: null });
    },

    updateUser(_attributes: { password?: string }) {
      return Promise.resolve({
        data: { user: DESKTOP_USER },
        error: null,
      });
    },

    resetPasswordForEmail(_email: string, _options?: { redirectTo?: string }) {
      return Promise.resolve({ data: {}, error: null });
    },

    onAuthStateChange(callback: AuthCallback) {
      listeners.add(callback);
      // Fire callback async to match Supabase behavior
      setTimeout(() => callback('SIGNED_IN', DESKTOP_SESSION), 0);
      return {
        data: {
          subscription: new DesktopSubscription(() => listeners.delete(callback)),
        },
      };
    },
  };
}
