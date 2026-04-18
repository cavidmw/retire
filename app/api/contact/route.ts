import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';

// ─── Rate limiter (IP-bazlı, in-memory) ─────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 5; // dakikada maksimum 5 gönderim

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

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

// ─── Metin temizleme: sadece düz metin, HTML/script yok ─────────────────────
function sanitizeText(input: unknown, maxLength: number): string | null {
  if (typeof input !== 'string') return null;
  // Null byte ve kontrol karakterlerini temizle
  const cleaned = input
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > maxLength) return null;
  return cleaned;
}

// ─── E-posta doğrulama ───────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  // RFC 5321 uyumlu basit regex
  const re = /^[^\s@"'<>]{1,64}@[^\s@"'<>]{1,255}\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

// ─── Ana handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  // 1. Rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // 2. Honeypot kontrolü — bot ise bu alanı doldurur
  if (body.website || body.phone_number || body._hp) {
    // Bot tespit edildi – sessizce başarı döndür (bot'u şaşırt)
    console.warn(`[Contact] Honeypot tetiklendi — IP: ${ip}`);
    return NextResponse.json({ ok: true });
  }

  // 3. Zaman kontrolü — formun zaten 3 saniyeden hızlı gönderilmesi bot işareti
  const loadedAt = typeof body._loadedAt === 'number' ? body._loadedAt : 0;
  const elapsed = Date.now() - loadedAt;
  if (loadedAt > 0 && elapsed < 3000) {
    console.warn(`[Contact] Çok hızlı gönderim (${elapsed}ms) — IP: ${ip}`);
    return NextResponse.json({ ok: true }); // bot'u şaşırt
  }

  // 4. Alan doğrulama ve temizleme
  const name = sanitizeText(body.name, 100);
  const email = sanitizeText(body.email, 254);
  const subject = sanitizeText(body.subject, 200);
  const message = sanitizeText(body.message, 5000);

  if (!name) {
    return NextResponse.json({ ok: false, error: 'Name is required (max 100 characters).' }, { status: 422 });
  }
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Email is required (max 254 characters).' }, { status: 422 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 422 });
  }
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'Subject is required (max 200 characters).' }, { status: 422 });
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message is required (max 5000 characters).' }, { status: 422 });
  }

  // 5. Supabase'e kaydet
  try {
    const { error } = await supabaseService
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: ip,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Contact] Supabase insert error:', error.message, error.details);
      return NextResponse.json(
        { ok: false, error: 'Message could not be saved. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[Contact] New message received — ${name} <${email}>`);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Contact] Unexpected error:', msg);
    return NextResponse.json(
      { ok: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
