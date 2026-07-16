/**
 * @project AncestorTree
 * @file src/app/api/export/gedcom/route.ts
 * @description API endpoint for GEDCOM 7.0 file export (admin/editor only)
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGedcom } from '@/lib/gedcom-export';
import type { TreeData } from '@/lib/supabase-data';

export async function GET(request: Request) {
  // Desktop mode: export handled client-side via generateGedcom()
  if (process.env.NEXT_PUBLIC_DESKTOP_MODE === 'true') {
    return NextResponse.json({ error: 'Use client-side export in desktop mode' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[export/gedcom] Missing SUPABASE_URL or SERVICE_ROLE_KEY');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Verify user is admin or editor
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch all tree data using service-role (bypass RLS for full export)
    const [peopleRes, familiesRes, childrenRes] = await Promise.all([
      supabase.from('people').select('*'),
      supabase.from('families').select('*'),
      supabase.from('children').select('family_id, person_id, sort_order'),
    ]);

    if (peopleRes.error) throw peopleRes.error;
    if (familiesRes.error) throw familiesRes.error;
    if (childrenRes.error) throw childrenRes.error;

    const treeData: TreeData = {
      people: peopleRes.data || [],
      families: familiesRes.data || [],
      children: childrenRes.data || [],
    };

    const content = generateGedcom(treeData);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(content, {
      headers: {
        'Content-Type': 'text/x-gedcom; charset=utf-8',
        'Content-Disposition': `attachment; filename="ancestortree-${date}.ged"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[export/gedcom] Error:', message);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
