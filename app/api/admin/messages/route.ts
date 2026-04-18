import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

// ─── Mesajları listele (GET) ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseService
      .from('contact_messages')
      .select('id, name, email, subject, message, is_read, created_at, ip_address')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin/Messages] Fetch error:', error.message);
      return NextResponse.json({ ok: false, error: 'Mesajlar alınamadı.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messages: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Messages] Beklenmedik hata:', msg);
    return NextResponse.json({ ok: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// ─── Mesajı okundu olarak işaretle (PATCH) ──────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Geçersiz istek.' }, { status: 400 });
  }

  const { id, is_read } = body;
  if (typeof id !== 'string' || id.trim() === '') {
    return NextResponse.json({ ok: false, error: 'Geçersiz id.' }, { status: 422 });
  }

  try {
    const { error } = await supabaseService
      .from('contact_messages')
      .update({ is_read: is_read === true })
      .eq('id', id);

    if (error) {
      console.error('[Admin/Messages] Update error:', error.message);
      return NextResponse.json({ ok: false, error: 'Güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Messages] Beklenmedik hata:', msg);
    return NextResponse.json({ ok: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// ─── Mesajı sil (DELETE) ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Geçersiz istek.' }, { status: 400 });
  }

  const { id } = body;
  if (typeof id !== 'string' || id.trim() === '') {
    return NextResponse.json({ ok: false, error: 'Geçersiz id.' }, { status: 422 });
  }

  try {
    const { error } = await supabaseService
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Admin/Messages] Delete error:', error.message);
      return NextResponse.json({ ok: false, error: 'Silinemedi.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Admin/Messages] Beklenmedik hata:', msg);
    return NextResponse.json({ ok: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}
