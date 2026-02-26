"use client";

export default function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-4 px-6">
      <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#A56A00]/20 to-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#A56A00]/40" />
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#A56A00]/20 to-transparent" />
      </div>
    </div>
  );
}
