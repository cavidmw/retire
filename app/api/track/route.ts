import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import crypto from 'crypto';

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max 30 tracking requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { path, postId } = body || {};

    if (!path) {
      return NextResponse.json({ ok: false, error: 'Path required' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Hash IP + User Agent + Daily Salt (optional) to make it anonymous but unique per visitor
    const visitorHash = crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');

    // Check if this visitor already viewed this path in the last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentViews, error: checkError } = await supabaseService
      .from('page_views')
      .select('id')
      .eq('visitor_hash', visitorHash)
      .eq('path', path)
      .gte('created_at', thirtyMinsAgo)
      .limit(1);

    if (checkError) {
      console.error('[Track] Error checking recent views:', checkError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // If already viewed recently, skip insert but return ok (deduplication)
    if (recentViews && recentViews.length > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Insert new view
    const { error: insertError } = await supabaseService
      .from('page_views')
      .insert({
        path,
        post_id: postId || null,
        visitor_hash: visitorHash,
      });

    if (insertError) {
      console.error('[Track] Error inserting view:', insertError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Track] Server error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
