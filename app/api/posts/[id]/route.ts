import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';

function mapRow(row: any) {
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

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const { data, error } = await supabaseService
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ item: mapRow(data) });
}
