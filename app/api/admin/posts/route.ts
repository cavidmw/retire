import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated, checkRateLimit, getClientIP } from '@/lib/adminAuth';

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

function normalizeDate(input?: string | null): string {
  if (!input) return new Date().toISOString().split('T')[0];
  // If already YYYY-MM-DD, keep as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authenticated = await isAdminAuthenticated(req);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, summary, content, coverImage, videoUrl, publishedAt } = body || {};

    if (!title || !content) {
      return NextResponse.json({ ok: false, error: 'title and content are required' }, { status: 400 });
    }

    // Base64 is not allowed; use Storage upload flow and provide a URL
    if (typeof coverImage === 'string' && coverImage.startsWith('data:')) {
      return NextResponse.json({ ok: false, error: 'Base64 images are not allowed. Upload the file first to Storage and use the returned URL.' }, { status: 400 });
    }

    const pubDate = normalizeDate(publishedAt);

    const { data, error } = await supabaseService
      .from('posts')
      .insert({
        title,
        summary: summary ?? '',
        content_html: content ?? '',
        cover_image_url: coverImage ?? '',
        youtube_url: videoUrl ?? '',
        published_at: pubDate,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create post', details: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: mapRow(data) }, { status: 201 });
  } catch (e: any) {
    console.error('Admin POST /api/admin/posts error:', e);
    return NextResponse.json({ ok: false, error: 'Internal server error', details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authenticated = await isAdminAuthenticated(req);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, summary, content, coverImage, videoUrl, publishedAt } = body || {};

    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    const update: any = {};
    if (title !== undefined) update.title = title;
    if (summary !== undefined) update.summary = summary;
    if (content !== undefined) update.content_html = content;
    if (coverImage !== undefined) update.cover_image_url = coverImage;
    if (videoUrl !== undefined) update.youtube_url = videoUrl;
    if (publishedAt !== undefined) update.published_at = normalizeDate(publishedAt);
    // Disallow base64 updates
    if (typeof coverImage === 'string' && coverImage.startsWith('data:')) {
      return NextResponse.json({ ok: false, error: 'Base64 images are not allowed. Upload the file first to Storage and use the returned URL.' }, { status: 400 });
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseService
      .from('posts')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update post', details: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: mapRow(data) });
  } catch (e: any) {
    console.error('Admin PUT /api/admin/posts error:', e);
    return NextResponse.json({ ok: false, error: 'Internal server error', details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authenticated = await isAdminAuthenticated(req);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    const { error } = await supabaseService.from('posts').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to delete post', details: error.message ?? String(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Admin DELETE /api/admin/posts error:', e);
    return NextResponse.json({ ok: false, error: 'Internal server error', details: e?.message ?? String(e) }, { status: 500 });
  }
}
