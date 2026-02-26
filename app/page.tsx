"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import BlogSection from "@/components/BlogSection";
import VideosSection from "@/components/VideosSection";
import SectionDivider from "@/components/SectionDivider";
import { getBlogs, BlogPost } from "@/lib/data";

export default function Home() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    setPosts(getBlogs());
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <SectionDivider />
      <BlogSection posts={posts} />
      <SectionDivider />
      <VideosSection />
      <Footer />
    </main>
  );
}