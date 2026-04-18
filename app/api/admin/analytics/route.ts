import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get total views and unique visitors
    const { data: summaryData, error: summaryError } = await supabaseService
      .from('page_views')
      .select('visitor_hash')
      .gte('created_at', sinceDate);

    if (summaryError) throw summaryError;

    const totalViews = summaryData.length;
    const uniqueVisitors = new Set(summaryData.map(v => v.visitor_hash)).size;

    // 2. Get views by day for chart
    // Supabase JS doesn't support complex group by easily, so we aggregate in JS since the dataset isn't millions yet
    const viewsByDay: Record<string, number> = {};
    const visitorsByDay: Record<string, Set<string>> = {};

    // Initialize all days to 0 to ensure continuous chart
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      viewsByDay[dateStr] = 0;
      visitorsByDay[dateStr] = new Set();
    }

    const { data: chartData, error: chartError } = await supabaseService
      .from('page_views')
      .select('created_at, visitor_hash')
      .gte('created_at', sinceDate);

    if (chartError) throw chartError;

    chartData.forEach((row) => {
      const dateStr = row.created_at.split('T')[0];
      if (viewsByDay[dateStr] !== undefined) {
        viewsByDay[dateStr]++;
        visitorsByDay[dateStr].add(row.visitor_hash);
      }
    });

    const chart = Object.keys(viewsByDay).map(date => ({
      date: date.substring(5), // MM-DD
      görüntülenme: viewsByDay[date],
      tekil: visitorsByDay[date].size
    }));

    // 3. Top Posts
    const { data: postsData, error: postsError } = await supabaseService
      .from('page_views')
      .select('post_id, path, posts(title)')
      .gte('created_at', sinceDate)
      .not('post_id', 'is', null);

    if (postsError) throw postsError;

    const postCounts: Record<string, { count: number, title: string }> = {};
    postsData.forEach((row: any) => {
      if (!row.post_id) return;
      if (!postCounts[row.post_id]) {
        postCounts[row.post_id] = { count: 0, title: row.posts?.title || 'Bilinmeyen Yazı' };
      }
      postCounts[row.post_id].count++;
    });

    const topPosts = Object.values(postCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      totalViews,
      uniqueVisitors,
      chart,
      topPosts
    });
  } catch (error: any) {
    console.error('[Admin Analytics] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
