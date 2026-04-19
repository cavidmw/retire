import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all posts from Supabase
    const { data: allPosts, error: allErr } = await supabaseService
      .from('posts')
      .select('id, title, status, published_at, updated_at')
      .order('updated_at', { ascending: false });

    if (allErr) {
      return NextResponse.json({ ok: false, error: allErr.message }, { status: 500 });
    }

    // 2. Fetch only published posts (same query as public API)
    const { data: pubPosts, error: pubErr } = await supabaseService
      .from('posts')
      .select('id, title, status, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (pubErr) {
      return NextResponse.json({ ok: false, error: pubErr.message }, { status: 500 });
    }

    // 3. Check for orphan blogs table (if exists)
    const { data: blogRows, error: blogErr } = await supabaseService
      .from('blogs')
      .select('id, title')
      .limit(10);

    const allIds = new Set((allPosts ?? []).map(p => p.id));
    const pubIds = new Set((pubPosts ?? []).map(p => p.id));

    // Find posts in admin but not in public (draft or other status)
    const adminOnly = (allPosts ?? []).filter(p => !pubIds.has(p.id));
    // Find posts in public but not in admin (should not happen)
    const publicOnly = (pubPosts ?? []).filter(p => !allIds.has(p.id));

    const report = {
      ok: true,
      timestamp: new Date().toISOString(),
      supabase_posts_table: {
        total: (allPosts ?? []).length,
        published: (pubPosts ?? []).length,
        drafts: (allPosts ?? []).filter(p => p.status === 'draft').length,
        other_status: (allPosts ?? []).filter(p => p.status !== 'published' && p.status !== 'draft').length,
      },
      blogs_table: blogErr
        ? { exists: false, note: 'blogs tablosu yok veya erişilemiyor' }
        : { exists: true, row_count: (blogRows ?? []).length, rows: blogRows },
      sync_issues: {
        admin_only_not_public: adminOnly.map(p => ({ id: p.id, title: p.title, status: p.status })),
        public_only_not_admin: publicOnly.map(p => ({ id: p.id, title: p.title })),
      },
      all_posts: (allPosts ?? []).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        published_at: p.published_at,
        updated_at: p.updated_at,
      })),
    };

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
