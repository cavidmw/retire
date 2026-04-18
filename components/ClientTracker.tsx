"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ClientTracker({ postId }: { postId?: string }) {
  const pathname = usePathname();
  const trackedRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    
    // Prevent double-tracking in React Strict Mode or fast re-renders
    if (trackedRef.current === pathname) return;
    trackedRef.current = pathname;

    const trackView = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            postId: postId || null
          })
        });
      } catch (err) {
        // Silently fail to not disrupt user experience
      }
    };

    // Small delay to ensure the page has actually loaded and isn't just a bot prefetch
    const timer = setTimeout(() => {
      trackView();
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, postId]);

  return null;
}
