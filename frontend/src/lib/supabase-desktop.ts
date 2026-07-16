/**
 * @project AncestorTree
 * @file src/lib/supabase-desktop.ts
 * @description Desktop Supabase client shim — mimics Supabase JS API surface,
 *              serializes query chains to JSON, sends to /api/desktop-db.
 *              Zero changes needed in data layer, hooks, or pages.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { createDesktopAuth, DESKTOP_USER_ID } from './supabase-desktop-auth';
import { createDesktopStorage } from './supabase-desktop-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Filter {
  type: 'eq' | 'in' | 'is' | 'ilike' | 'not' | 'or';
  column?: string;
  value?: unknown;
  // For .not(): operator + value
  operator?: string;
  // For .or(): condition string
  condition?: string;
}

interface QueryPayload {
  table: string;
  method: 'select' | 'insert' | 'update' | 'delete';
  columns?: string;
  body?: Record<string, unknown> | Record<string, unknown>[];
  filters: Filter[];
  order?: { column: string; ascending: boolean }[];
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
}

interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number;
}

// ─── Query Builder ──────────────────────────────────────────────────────────

class DesktopQueryBuilder {
  private payload: QueryPayload;

  constructor(table: string, method: QueryPayload['method'], bodyOrColumns?: unknown) {
    this.payload = {
      table,
      method,
      filters: [],
      order: [],
    };

    if (method === 'select') {
      this.payload.columns = (bodyOrColumns as string) || '*';
    } else if (method === 'insert' || method === 'update') {
      this.payload.body = bodyOrColumns as Record<string, unknown>;
    }
  }

  select(columns?: string): this {
    // Used after .insert() or .update() to return the row
    this.payload.columns = columns || '*';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.payload.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.payload.filters.push({ type: 'in', column, value: values });
    return this;
  }

  is(column: string, value: null): this {
    this.payload.filters.push({ type: 'is', column, value });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.payload.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    this.payload.filters.push({ type: 'not', column, operator, value });
    return this;
  }

  or(condition: string): this {
    this.payload.filters.push({ type: 'or', condition });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    if (!this.payload.order) this.payload.order = [];
    this.payload.order.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  limit(count: number): this {
    this.payload.limit = count;
    return this;
  }

  single(): PromiseLike<SupabaseResponse> {
    this.payload.single = true;
    return this.execute();
  }

  maybeSingle(): PromiseLike<SupabaseResponse> {
    this.payload.maybeSingle = true;
    return this.execute();
  }

  then<TResult1 = SupabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<SupabaseResponse> {
    try {
      const response = await fetch('/api/desktop-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.payload),
      });

      const result = await response.json();
      return result as SupabaseResponse;
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Desktop DB request failed' },
      };
    }
  }
}

// ─── Desktop Supabase Client ────────────────────────────────────────────────

function createDesktopSupabaseClient() {
  const auth = createDesktopAuth();
  const storage = createDesktopStorage();

  return {
    auth,
    storage,

    from(table: string) {
      return {
        select(columns?: string) {
          return new DesktopQueryBuilder(table, 'select', columns);
        },
        insert(data: Record<string, unknown> | Record<string, unknown>[]) {
          return new DesktopQueryBuilder(table, 'insert', data);
        },
        update(data: Record<string, unknown>) {
          return new DesktopQueryBuilder(table, 'update', data);
        },
        delete() {
          return new DesktopQueryBuilder(table, 'delete');
        },
      };
    },

    async rpc(functionName: string, params?: Record<string, unknown>) {
      try {
        const response = await fetch('/api/desktop-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'rpc',
            functionName,
            params: params || {},
          }),
        });
        const result = await response.json();
        return result as SupabaseResponse;
      } catch (err) {
        return {
          data: null,
          error: { message: err instanceof Error ? err.message : 'RPC call failed' },
        };
      }
    },
  };
}

// Export singleton
export const desktopSupabase = createDesktopSupabaseClient();
export { DESKTOP_USER_ID };
