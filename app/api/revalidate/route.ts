import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Simple secret check — set REVALIDATE_SECRET in your env or skip if not set
    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const path = body?.path || '/';

    revalidatePath(path, 'page');
    revalidatePath('/', 'page');
    revalidatePath('/sitemap.xml');

    console.log(`[Revalidate] Paths revalidated: ${path}, /, /sitemap.xml`);
    return NextResponse.json({ ok: true, revalidated: [path, '/', '/sitemap.xml'], time: new Date().toISOString() });
  } catch (e: any) {
    console.error('[Revalidate] Error:', e);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
