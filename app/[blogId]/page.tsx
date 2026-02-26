"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBlogById, BlogPost } from "@/lib/data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

export default function BlogDetailPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogId) {
      const found = getBlogById(blogId);
      setPost(found);
      setLoading(false);
    }
  }, [blogId]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-[#F4C97A]/30 border-t-[#F4C97A] rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
          <h1 className="text-3xl font-bold text-[#3A2E22]">Article Not Found</h1>
          <p className="text-[#6B5C4A]/80">This article may have been removed or the link is incorrect.</p>
          <a href="/" className="mt-4 px-6 py-2.5 bg-[#EFCB88] text-[#3A2E22] font-bold rounded-full text-sm hover:bg-[#EFCB88]/90 transition-colors">
            Back to Home
          </a>
        </div>
      </main>
    );
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
