"use client";

import { useEffect, useRef, useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

function useScrollReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}

function VideoCard({ video, index, animateNow = false }: { video: VideoItem; index: number; animateNow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If we're expanding via the button, animate immediately with stagger
    if (animateNow) {
      el.classList.remove("visible");
      const t = setTimeout(() => el.classList.add("visible"), index * 80);
      return () => clearTimeout(t);
    }

    // Fallback: reveal on intersection
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), index * 80);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [index, animateNow]);

  return (
    <div
      ref={ref}
      className="scroll-reveal group cursor-pointer"
      onClick={() => window.open(video.url, "_blank")}
    >
      <div className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#EFCB88] hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-[#FF0000]/90 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* YouTube badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5">
            <svg viewBox="0 0 24 24" fill="#FF0000" className="w-3.5 h-3.5">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </div>
        {/* Title */}
        <div className="p-3">
          <p className="text-[#3A2E22] text-sm font-medium leading-snug line-clamp-2 group-hover:text-[#A56A00] transition-colors duration-200">
            {video.title}
          </p>
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_VIDEOS: VideoItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `placeholder-${i}`,
  title: [
    "Top 5 Affordable Retirement Towns in Mississippi",
    "Living on $2,500/Month in Arkansas – Full Tour",
    "Is Hot Springs AR a Good Place to Retire?",
    "Small Town America: What Retirement Really Looks Like",
    "Cost of Living Breakdown: Oxford, Mississippi",
    "Hidden Gem Retirement Towns in the American South",
    "Why Retirees Are Leaving Florida for These States",
    "The Honest Truth About Small-Town Retirement",
    "Best Retirement Towns Under $1,000/Month Rent",
    "Moving to the Midwest for Retirement – Pros & Cons",
    "Healthcare Access in Small-Town America",
    "Retire Early: Towns Where Your Dollar Goes Further",
    "Is Tennessee Good for Retirement? Full Review",
    "Affordable Retirement in the Ozarks",
    "Community vs. Cost: Finding the Right Balance",
    "Top Small Towns for Active Retirees in the USA",
  ][i],
  thumbnail: `https://picsum.photos/seed/vid${i + 10}/640/360`,
  url: "https://www.youtube.com/@RetireTownwise",
}));

export default function VideosSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justExpanded, setJustExpanded] = useState(false);

  useScrollReveal(headingRef);

  useEffect(() => {
    fetch("/api/youtube/recent")
      .then(async (r) => {
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || "YouTube API failed");
        }
        return r.json();
      })
      .then((data) => {
        const items: VideoItem[] = (data?.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          url: item.url,
        }));
        setVideos(items.length > 0 ? items : PLACEHOLDER_VIDEOS);
      })
      .catch((e) => {
        console.error("Failed to load videos:", e);
        setVideos(PLACEHOLDER_VIDEOS);
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleVideos = showAll ? videos : videos.slice(0, 8);

  return (
    <section id="videos" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="scroll-reveal mb-16 text-center">
          <span className="inline-block text-[#4F8F4E] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            YouTube Channel
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#3A2E22] mb-4">
            Latest <span className="text-[#A56A00]">Videos</span>
          </h2>
          <p className="text-[#6B5C4A]/80 text-base max-w-xl mx-auto">
            Watch our in-depth video guides on retirement towns, cost of living comparisons, and relocation tips.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#FFFBF1] rounded-xl overflow-hidden animate-pulse border border-[#E8DAC0]">
                <div className="w-full bg-black/10" style={{ paddingBottom: "56.25%" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-black/10 rounded w-full" />
                  <div className="h-3 bg-black/10 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleVideos.map((video, i) => {
                const isNew = showAll && i >= 8;
                const relIndex = isNew ? i - 8 : i;
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    index={relIndex}
                    animateNow={justExpanded && isNew}
                  />
                );
              })}
            </div>

            {/* More button with gradient overlay */}
            {!showAll && videos.length > 8 && (
              <div className="relative mt-0">
                <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-[#FFF6DA] to-transparent pointer-events-none" />
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setShowAll(true);
                      setJustExpanded(true);
                      // Reset the flag after initial mount to avoid re-animating on scroll
                      setTimeout(() => setJustExpanded(false), 1200);
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <span className="text-[#6B5C4A]/70 text-xs uppercase tracking-widest font-medium group-hover:text-[#A56A00] transition-colors duration-200">
                      More Videos
                    </span>
                    {/* Triangle */}
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-[#A56A00]/50 group-hover:border-t-[#A56A00] transition-all duration-200" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        .scroll-reveal { 
          opacity: 0; 
          transform: translateY(14px); 
          transition: opacity 380ms ease, transform 380ms ease; 
          will-change: opacity, transform;
        }
        .scroll-reveal.visible { 
          opacity: 1; 
          transform: none; 
        }
      `}</style>
    </section>
  );
}
