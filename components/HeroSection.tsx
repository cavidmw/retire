"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ChannelStats {
  subscribers: string;
  views: string;
  videos: string;
}

function formatCount(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function AnimatedNumber({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{formatCount(current)}</span>;
}

export default function HeroSection() {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

    if (apiKey && channelId) {
      fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
      )
        .then((r) => r.json())
        .then((data) => {
          const s = data?.items?.[0]?.statistics;
          if (s) {
            setStats({
              subscribers: s.subscriberCount,
              views: s.viewCount,
              videos: s.videoCount,
            });
          }
        })
        .catch(() => {
          setStats({ subscribers: "12400", views: "847000", videos: "94" });
        });
    } else {
      setStats({ subscribers: "12400", views: "847000", videos: "94" });
    }
  }, []);

  const statItems = stats
    ? [
        { label: "Subscribers", value: parseInt(stats.subscribers), icon: "👥" },
        { label: "Total Views", value: parseInt(stats.views), icon: "👁" },
        { label: "Videos", value: parseInt(stats.videos), icon: "🎬" },
      ]
    : null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF5] via-[#FFF6DA] to-[#FBEED3]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#EFCB8815_0%,_transparent_70%)]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#E8DAC0 1px, transparent 1px), linear-gradient(90deg, #E8DAC0 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto transition-all duration-1000 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Logo circle */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFFBF1] to-[#FFF6DA] border-2 border-[#EFCB88]/60 flex items-center justify-center mb-6 shadow-xl shadow-[rgba(0,0,0,0.08)] overflow-hidden">
          <Image
            src="/logo.png"
            alt="Retire Townwise logo"
            width={96}
            height={96}
            className="rounded-full object-cover"
            priority
          />
        </div>

        {/* Channel name */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#3A2E22] mb-3 tracking-tight">
          Retire <span className="text-[#A56A00]">Townwise</span>
        </h1>

        {/* Description */}
        <p className="text-[#6B5C4A]/85 text-lg md:text-xl font-light leading-relaxed mb-10 max-w-xl">
          Honest research on affordable & livable retirement towns across America — no fluff, just facts.
        </p>

        {/* Stats counter */}
        {statItems && (
          <div className="flex items-center gap-6 md:gap-12 mb-10 flex-wrap justify-center">
            {statItems.map((item, i) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl md:text-4xl font-extrabold text-[#A56A00] tabular-nums">
                  <AnimatedNumber target={item.value} duration={1600 + i * 200} />
                </span>
                <span className="text-[#6B5C4A]/70 text-xs font-medium uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <a
          href="https://www.youtube.com/@RetireTownwise"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-base px-8 py-4 rounded-full shadow-2xl shadow-red-900/40 transition-all duration-300 hover:scale-105 hover:shadow-red-800/50 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Go to Channel
        </a>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <span className="text-xs text-[#6B5C4A] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#A56A00] to-transparent" />
        </div>
      </div>
    </section>
  );
}
