"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BlogPost } from "@/lib/data";

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

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div
      className="group cursor-pointer flex-shrink-0 w-full"
      onClick={() => window.open(`/${post.id}`, "_blank")}
    >
      <div className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#EFCB88] hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 h-full">
        {/* Cover image */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "66.67%" }}>
          <img
            src={post.coverImage || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-[#4F8F4E] text-xs font-semibold uppercase tracking-widest mb-2">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h3 className="text-[#3A2E22] font-bold text-base leading-snug mb-3 group-hover:text-[#A56A00] transition-colors duration-200 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-[#6B5C4A]/80 text-sm leading-relaxed line-clamp-3">
            {post.summary}
          </p>
          <div className="mt-4 flex items-center gap-1 text-[#8FA6BF] text-xs font-semibold">
            <span>Read article</span>
            <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogSection({ posts }: { posts: BlogPost[] }) {
  const headingRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useScrollReveal(headingRef);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, posts.length - cardsPerView);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxIndex;

  const translateX = -(currentIndex * (100 / cardsPerView));

  return (
    <section id="blogs" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section heading row with arrows */}
        <div ref={headingRef} className="scroll-reveal mb-14">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-block text-[#4F8F4E] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                Research & Guides
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#3A2E22] mb-3">
                Latest <span className="text-[#A56A00]">Blog Posts</span>
              </h2>
              <p className="text-[#6B5C4A]/80 text-base max-w-xl">
                Honest, in-depth guides on retirement towns, cost of living, and relocation planning across the USA.
              </p>
            </div>

            {/* Carousel arrows */}
            {posts.length > cardsPerView && (
              <div className="flex items-center gap-2 mt-2 flex-shrink-0 self-center">
                <button
                  onClick={prev}
                  disabled={!canPrev}
                  aria-label="Previous"
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    canPrev
                      ? "border-[#EFCB88]/70 text-[#A56A00] hover:bg-[#EFCB88]/20 hover:border-[#A56A00]"
                      : "border-black/10 text-black/20 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  disabled={!canNext}
                  aria-label="Next"
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    canNext
                      ? "border-[#EFCB88]/70 text-[#A56A00] hover:bg-[#EFCB88]/20 hover:border-[#A56A00]"
                      : "border-black/10 text-black/20 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel track */}
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-in-out gap-6"
            style={{
              transform: `translateX(calc(${translateX}% - ${currentIndex * 24 / cardsPerView}px))`,
            }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                style={{ width: `calc(${100 / cardsPerView}% - ${(cardsPerView - 1) * 24 / cardsPerView}px)`, flexShrink: 0 }}
              >
                <BlogCard post={post} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {posts.length > cardsPerView && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-6 h-1.5 bg-[#A56A00]"
                    : "w-1.5 h-1.5 bg-black/20 hover:bg-black/40"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
