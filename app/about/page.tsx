"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useRef } from "react";

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

const values = [
  {
    icon: "🔍",
    title: "Honest Research",
    desc: "We don't romanticize. Every town review includes real trade-offs — healthcare access, weather realities, social scene, and actual costs.",
  },
  {
    icon: "💰",
    title: "Affordability First",
    desc: "We focus on towns where a modest retirement income truly goes far — not just cheap on paper, but genuinely livable.",
  },
  {
    icon: "🏘️",
    title: "Community Matters",
    desc: "A low cost of living means little if you're isolated. We evaluate social infrastructure, local amenities, and community feel.",
  },
  {
    icon: "📍",
    title: "USA Focused",
    desc: "Our scope is entirely within the United States — whether you're moving across state lines or planning your first retirement relocation.",
  },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  useScrollReveal(heroRef);
  useScrollReveal(missionRef);
  useScrollReveal(valuesRef);
  useScrollReveal(channelRef);

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#4F8F4E15_0%,_transparent_60%)]" />
        <div ref={heroRef} className="scroll-reveal relative z-10 max-w-3xl mx-auto text-center">
          <span className="inline-block text-[#4F8F4E] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#3A2E22] mb-6 leading-tight">
            About <span className="text-[#A56A00]">Retire Townwise</span>
          </h1>
          <p className="text-[#6B5C4A]/80 text-xl leading-relaxed">
            We're a research-driven platform helping Americans find affordable,
            livable retirement towns — with honest information, no fluff.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div ref={missionRef} className="scroll-reveal bg-[#FFFBF1] border border-[#E8DAC0] rounded-3xl p-10 md:p-14">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#3A2E22] mb-6">
              Our <span className="text-[#A56A00]">Mission</span>
            </h2>
            <div className="space-y-5 text-[#6B5C4A]/85 text-base leading-relaxed">
              <p>
                Retire Townwise was created for one reason: most retirement planning resources are either too vague, 
                too optimistic, or focused on expensive destinations. We set out to change that.
              </p>
              <p>
                Every town we cover gets the same treatment — real rent numbers, actual grocery costs, honest takes 
                on healthcare access, a clear-eyed look at climate, and a frank assessment of what daily life actually 
                looks like. We note the pros. We note the cons. We don't skip the parts that might make you think twice.
              </p>
              <p>
                Our goal is simple: give you the information you need to make a confident decision about where to 
                spend your retirement years — without spending weeks doing the research yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div ref={valuesRef} className="scroll-reveal mb-12 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#3A2E22]">
              What We <span className="text-[#A56A00]">Stand For</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-7 hover:border-[#A56A00]/30 transition-colors duration-300"
              >
                <span className="text-3xl mb-4 block">{v.icon}</span>
                <h3 className="text-[#3A2E22] font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-[#6B5C4A]/80 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube channel CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            ref={channelRef}
            className="scroll-reveal bg-gradient-to-br from-[#FFFBF1] to-[#FFF6DA] border border-[#E8DAC0] rounded-3xl p-10 md:p-14 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF0000]/15 border border-[#FF0000]/30 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="#FF0000" className="w-8 h-8">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#3A2E22] mb-4">
              Follow Along on <span className="text-[#FF0000]">YouTube</span>
            </h2>
            <p className="text-[#6B5C4A]/80 text-base leading-relaxed mb-8 max-w-xl mx-auto">
              We publish in-depth video tours, cost breakdowns, and real-life retirement town guides 
              regularly on our YouTube channel. Subscribe so you don't miss a thing.
            </p>
            <a
              href="https://www.youtube.com/@RetireTownwise"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-sm px-8 py-4 rounded-full shadow-2xl shadow-red-900/30 transition-all duration-300 hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Visit Our Channel
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
