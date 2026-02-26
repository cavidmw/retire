"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

type NavLink = {
  label: string;
  href: string;
  sectionId?: string;
  newTab: boolean;
};

const navLinks: NavLink[] = [
  { label: "Home", href: "/", sectionId: "top", newTab: false },
  { label: "Blogs", href: "/#blogs", sectionId: "blogs", newTab: false },
  { label: "Videos", href: "/#videos", sectionId: "videos", newTab: false },
  { label: "About", href: "/about", newTab: true },
  { label: "Contact", href: "/contact", newTab: true },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (!isHomePage) return;

      const sections = ["blogs", "videos"];
      let current = "top";

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleNavClick = (link: NavLink) => {
    setMenuOpen(false);

    if (link.newTab) {
      window.open(link.href, "_blank");
      return;
    }

    // Home always scrolls to top
    if (link.sectionId === "top") {
      if (isHomePage) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.location.href = "/";
      }
      return;
    }

    // Blogs / Videos
    if (link.sectionId) {
      if (isHomePage) {
        const el = document.getElementById(link.sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = `/#${link.sectionId}`;
      }
    }
  };

  const isActive = (link: NavLink) => {
    if (!isHomePage) return false;
    if (link.sectionId === "top") return activeSection === "top";
    if (link.sectionId === "blogs") return activeSection === "blogs";
    if (link.sectionId === "videos") return activeSection === "videos";
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FFF6DA]/90 backdrop-blur-md border-b border-[#E8DAC0]"
          : "bg-[rgba(255,253,245,0.85)] backdrop-blur-md border-b border-[#E8DAC0]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => handleNavClick(navLinks[0])}
        >
          <Image
            src="/logo.png"
            alt="Retire Townwise logo"
            width={44}
            height={44}
            className="rounded-full border-2 border-[#EFCB88]/60 bg-[#FFFBF1] object-cover flex-shrink-0"
            priority
          />
          <span className="text-[#A56A00] font-bold text-base tracking-wide hidden sm:block">
            Retire Townwise
          </span>
        </div>

        {/* Desktop nav + hamburger */}
        <div className="relative flex items-center gap-1" ref={menuRef}>
          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-0.5 mr-2">
            {navLinks.map((link) => {
              const active = isActive(link);
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg hover:bg-black/5 group"
                  style={{ color: active ? "#A56A00" : "#3A2E22" }}
                >
                  <span className="group-hover:text-[#A56A00] transition-colors duration-200">
                    {link.label}
                  </span>
                  {/* Active underline */}
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#A56A00] transition-all duration-300 ease-in-out"
                    style={{ width: active ? "60%" : "0%" }}
                  />
                  {/* Hover underline */}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#A56A00]/30 w-0 group-hover:w-[40%] transition-all duration-200 ease-in-out" />
                </button>
              );
            })}
          </nav>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 transition-colors duration-200"
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-0.5 bg-[#EFCB88] transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#EFCB88] mt-1 transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[#EFCB88] mt-1 transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {menuOpen && (
            <div className="absolute top-14 right-0 w-52 origin-top-right bg-[#FFFBF1]/98 backdrop-blur-xl border border-[#E8DAC0] rounded-xl shadow-xl overflow-hidden animate-fade-in-down">
              {navLinks.map((link, i) => {
                const active = isActive(link);
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link)}
                    className={`w-full text-left px-5 py-3 text-sm font-medium transition-all duration-150 flex items-center justify-between group ${
                      i < navLinks.length - 1 ? "border-b border-[#E8DAC0]" : ""
                    } ${active ? "text-[#A56A00]" : "text-[#3A2E22] hover:text-[#A56A00]"} hover:bg-[#A56A00]/5`}
                  >
                    <span>{link.label}</span>
                    {link.newTab && (
                      <svg className="w-3 h-3 opacity-40 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
