import { MetadataRoute } from 'next';
import { supabaseService } from '@/lib/supabaseServer';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://retiretownwise.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Fetch blog posts for dynamic pages (with error handling)
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const { data: posts, error } = await supabaseService
      .from('posts')
      .select('id, updated_at, published_at')
      .order('published_at', { ascending: false });

    if (!error && posts) {
      blogPages = posts.map((post) => ({
        url: `${BASE_URL}/${post.id}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch (e) {
    console.error('[Sitemap] Failed to fetch posts:', e);
  }

  return [...staticPages, ...blogPages];
}
