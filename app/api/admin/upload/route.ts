import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated, checkRateLimit, getClientIP } from '@/lib/adminAuth';

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
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
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    // 10MB limit
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      return NextResponse.json({ ok: false, error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Only images are allowed
    const type = file.type || 'application/octet-stream';
    if (!type.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: 'Only image uploads are allowed.' }, { status: 400 });
    }

    // Ensure bucket exists and is public
    try {
      const { data: bucketInfo } = await supabaseService.storage.getBucket('covers');
      if (!bucketInfo) {
        const { error: createErr } = await supabaseService.storage.createBucket('covers', { public: true });
        if (createErr) {
          // If already exists, ignore; otherwise error out
          const msg = createErr.message ?? String(createErr);
          if (!/exists/i.test(msg)) {
            console.error('Create bucket error:', createErr);
            return NextResponse.json({ ok: false, error: 'Failed to ensure bucket', details: msg }, { status: 500 });
          }
        }
      }
    } catch (e: any) {
      console.error('Bucket ensure error:', e);
      return NextResponse.json({ ok: false, error: 'Failed to access bucket', details: e?.message ?? String(e) }, { status: 500 });
    }

    const safeName = sanitizeName(file.name || 'image');
    const dotIdx = safeName.lastIndexOf('.');
    const ext = dotIdx > -1 ? safeName.slice(dotIdx) : '';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const path = `covers/${fileName}`; // store inside a 'covers' folder within the bucket

    const { error: uploadError } = await supabaseService.storage
      .from('covers')
      .upload(path, file, {
        contentType: type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json({ ok: false, error: 'Upload failed', details: uploadError.message ?? String(uploadError) }, { status: 500 });
    }

    const { data: publicData } = supabaseService.storage.from('covers').getPublicUrl(path);
    const url = publicData?.publicUrl;
    if (!url) {
      return NextResponse.json({ ok: false, error: 'Failed to get public URL' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url, path });
  } catch (e: any) {
    console.error('Admin POST /api/admin/upload error:', e);
    return NextResponse.json({ ok: false, error: 'Internal server error', details: e?.message ?? String(e) }, { status: 500 });
  }
}
