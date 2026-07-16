/**
 * @project AncestorTree
 * @file src/app/api/cron/route.ts
 * @description Vercel Cron — lightweight database keep-alive ping
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cron] keep-alive failed:', message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
