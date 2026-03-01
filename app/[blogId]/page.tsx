import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://retiretownwise.com';

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  videoUrl: string;
  publishedAt: string;
}

function mapRow(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title ?? '',
    summary: row.summary ?? '',
    content: row.content_html ?? '',
    coverImage: row.cover_image_url ?? '',
    videoUrl: row.youtube_url ?? '',
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
  };
}

async function getPost(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseService
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function generateMetadata({ params }: { params: Promise<{ blogId: string }> }): Promise<Metadata> {
  const { blogId } = await params;
  const post = await getPost(blogId);
  if (!post) {
    return { title: 'Article Not Found | Retire Townwise' };
  }
  return {
    title: `${post.title} | Retire Townwise`,
    description: post.summary || post.title,
    openGraph: {
      title: post.title,
      description: post.summary || post.title,
      url: `${BASE_URL}/${post.id}`,
      type: 'article',
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : [],
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary || post.title,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

function VideoEmbed({ url }: { url: string }) {
  if (!url) return null;

  const getYouTubeId = (u: string) => {
    const match = u.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;

  return (
    <div className="my-10">
      <div className="w-full rounded-2xl overflow-hidden border border-[#E8DAC0] shadow-xl shadow-black/10">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block w-full"
          style={{ paddingBottom: "56.25%" }}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="Watch on YouTube"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[#FFFBF1]" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#FF0000] flex items-center justify-center shadow-2xl shadow-red-900/60 group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white/90 text-sm font-semibold tracking-wide bg-black/40 px-4 py-1.5 rounded-full">
              Watch on YouTube
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function BlogDetailPage({ params }: { params: Promise<{ blogId: string }> }) {
  const { blogId } = await params;
  const post = await getPost(blogId);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero image */}
      {post.coverImage && (
        <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#FFF6DA]" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pb-24" style={{ marginTop: post.coverImage ? "-80px" : "120px" }}>
        {/* Meta */}
        <div className="relative z-10 mb-8">
          <p className="text-[#4F8F4E] text-xs font-bold uppercase tracking-widest mb-3">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A2E22] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-[#6B5C4A]/85 text-lg leading-relaxed border-l-4 border-[#A56A00]/30 pl-4">
            {post.summary}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#A56A00]/20 to-transparent mb-10" />

        {/* Content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Video embed */}
        {post.videoUrl && <VideoEmbed url={post.videoUrl} />}

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-[#E8DAC0]">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#8FA6BF] text-sm font-medium hover:text-[#A56A00] transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all articles
          </a>
        </div>
      </article>

      <Footer />
    </main>
  );
}
