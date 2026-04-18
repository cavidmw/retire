import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated, checkRateLimit, getClientIP } from '@/lib/adminAuth';
import sanitizeHtml from 'sanitize-html';

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
    status: row.status ?? 'published',
    updatedAt: row.updated_at ?? null,
  };
}

function normalizeDate(input?: string | null): string {
  if (!input) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

async function assertAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// Allowed tags for our blog content
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'img': ['src', 'alt', 'width', 'height'],
    'iframe': ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    '*': ['style', 'class'], // Allow basic styling
  },
};

// ─── GET: all posts (admin — includes drafts) ────────────────────────────────
export async function GET(req: NextRequest) {
  const authErr = await assertAdmin(req);
  if (authErr) return authErr;

  try {
    const { data, error } = await supabaseService
      .from('posts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Admin GET /posts] Supabase error:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: (data ?? []).map(mapRow) });
  } catch (e: any) {
    console.error('[Admin GET /posts] error:', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// ─── POST: create post ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authErr = await assertAdmin(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { title, summary, content, coverImage, videoUrl, publishedAt, status } = body || {};

    if (!title && !content) {
      return NextResponse.json({ ok: false, error: 'title or content required' }, { status: 400 });
    }

    if (typeof coverImage === 'string' && coverImage.startsWith('data:')) {
      return NextResponse.json({ ok: false, error: 'Base64 images not allowed.' }, { status: 400 });
    }

    const pubDate = normalizeDate(publishedAt);
    const postStatus = status === 'draft' ? 'draft' : 'published';
    const cleanContent = sanitizeHtml(content ?? '', sanitizeOptions);

    const { data, error } = await supabaseService
      .from('posts')
      .insert({
        title: title ?? '',
        summary: summary ?? '',
        content_html: cleanContent,
        cover_image_url: coverImage ?? '',
        youtube_url: videoUrl ?? '',
        published_at: pubDate,
        status: postStatus,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Admin POST /posts] Supabase error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to create post', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: mapRow(data) }, { status: 201 });
  } catch (e: any) {
    console.error('[Admin POST /posts] error:', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// ─── PUT: update post ────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authErr = await assertAdmin(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { id, title, summary, content, coverImage, videoUrl, publishedAt, status } = body || {};

    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    const update: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) update.title = title;
    if (summary !== undefined) update.summary = summary;
    if (content !== undefined) update.content_html = sanitizeHtml(content, sanitizeOptions);
    if (coverImage !== undefined) {
      if (typeof coverImage === 'string' && coverImage.startsWith('data:')) {
        return NextResponse.json({ ok: false, error: 'Base64 images not allowed.' }, { status: 400 });
      }
      update.cover_image_url = coverImage;
    }
    if (videoUrl !== undefined) update.youtube_url = videoUrl;
    if (publishedAt !== undefined) update.published_at = normalizeDate(publishedAt);
    if (status !== undefined) update.status = status === 'draft' ? 'draft' : 'published';

    const { data, error } = await supabaseService
      .from('posts')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[Admin PUT /posts] Supabase error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update post', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: mapRow(data) });
  } catch (e: any) {
    console.error('[Admin PUT /posts] error:', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// ─── DELETE: delete post ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const authErr = await assertAdmin(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    const { error } = await supabaseService.from('posts').delete().eq('id', id);
    if (error) {
      console.error('[Admin DELETE /posts] Supabase error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to delete post', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[Admin DELETE /posts] error:', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
