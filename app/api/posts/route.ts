import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function mapRowToBlogPost(row: any) {
  return {
    id: row.id,
    slug: row.id,
    title: row.title ?? '',
    summary: row.summary ?? '',
    content: row.content_html ?? '',
    coverImage: row.cover_image_url ?? '',
    videoUrl: row.youtube_url ?? '',
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let query = supabaseService
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (limit && !Number.isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API /posts] Supabase error:', error.message);
      return NextResponse.json({ items: [], error: error.message }, { status: 200 });
    }

    const items = (data ?? []).map(mapRowToBlogPost);
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[API /posts] Unexpected error:', e);
    return NextResponse.json({ items: [], error: e?.message || 'Unknown error' }, { status: 200 });
  }
}
