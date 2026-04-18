"use client";

/**
 * RichEditor — Tiptap v3 tabanlı tam özellikli blog editörü
 * 
 * Özellikler: Bold · Italic · Underline · Strikethrough · Metin Rengi
 * Highlight · H1/H2/H3 · Bullet/Ordered list · Blockquote · Code block
 * Yatay çizgi · Link · Geri al/İleri al · Karakter sayacı
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import { CharacterCount } from "@tiptap/extension-character-count";
import { useEffect, useCallback, useRef, useState } from "react";
import DOMPurify from "dompurify";

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  Undo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>,
  Redo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>,
  Bold: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 12a4 4 0 0 0 0-8H6v8" /><path d="M15 20a4 4 0 0 0 0-8H6v8Z" /></svg>,
  Italic: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>,
  Underline: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" /></svg>,
  Strike: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12" /><path d="M16 6C16 6 13.58 4 12 4 9.5 4 8 5.5 8 7.5S9.5 11 12 11c2.5 0 4 1.5 4 3.5S14.5 20 12 20c-1.58 0-4-2-4-2" /></svg>,
  TextColor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m3 21 4-11 4 11" /><path d="M5.5 15h5" /><path d="M14 19h5" /><path d="M16.5 15v4" /><path d="m14 11 4-11 4 11" /></svg>,
  Highlight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>,
  ListBullet: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  ListNumber: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>,
  Quote: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>,
  Code: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
  Rule: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="4" y1="12" x2="20" y2="12" /></svg>,
  Link: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  Unlink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" /><path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" /><line x1="8" y1="2" x2="8" y2="5" /><line x1="2" y1="8" x2="5" y2="8" /><line x1="16" y1="19" x2="16" y2="22" /><line x1="19" y1="16" x2="22" y2="16" /></svg>,
  Clear: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

// ─── Toolbar button ──────────────────────────────────────────────────────────
function Btn({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onClick();
        }}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-100 select-none flex-shrink-0
          ${disabled ? "opacity-30 cursor-default" :
            active
              ? "bg-[#EFCB88] text-[#3A2E22] shadow-sm"
              : "text-[#6B5C4A] hover:bg-[#E8DAC0]/60 hover:text-[#3A2E22]"
          }
        `}
      >
        {children}
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-black/80 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {title}
      </div>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-[#E8DAC0] mx-1 self-center flex-shrink-0" />;
}

// ─── Link dialog ──────────────────────────────────────────────────────────────
function LinkDialog({
  open,
  initial,
  onConfirm,
  onClose,
}: {
  open: boolean;
  initial: string;
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setVal(initial);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[#3A2E22] font-bold text-base mb-4">Bağlantı Ekle</h3>
        <input
          ref={ref}
          type="url"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(val);
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://..."
          className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-2.5 text-sm text-[#3A2E22] outline-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B5C4A] hover:text-[#3A2E22] rounded-lg transition-colors">İptal</button>
          <button onClick={() => onConfirm(val)} className="px-4 py-2 text-sm font-semibold bg-[#EFCB88] hover:bg-[#EFCB88]/90 text-[#3A2E22] rounded-lg transition-colors">Uygula</button>
        </div>
      </div>
    </div>
  );
}

// ─── Color picker dropdown ────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: "Kırmızı", value: "#DC2626" },
  { label: "Turuncu", value: "#EA580C" },
  { label: "Altın", value: "#A56A00" },
  { label: "Yeşil", value: "#4F8F4E" },
  { label: "Mavi", value: "#2563EB" },
  { label: "Mor", value: "#7C3AED" },
  { label: "Gri", value: "#6B7280" },
  { label: "Siyah", value: "#000000" },
];

const HIGHLIGHT_COLORS = [
  { label: "Sarı", value: "#FEF08A" },
  { label: "Yeşil", value: "#BBF7D0" },
  { label: "Mavi", value: "#BAE6FD" },
  { label: "Pembe", value: "#FBCFE8" },
  { label: "Turuncu", value: "#FED7AA" },
];

const LOCAL_STORAGE_COLORS_KEY = 'rt_editor_favorite_colors';

function ColorMenu({
  colors,
  onSelect,
}: {
  colors: { label: string; value: string }[];
  onSelect: (v: string) => void;
}) {
  const [customColor, setCustomColor] = useState("#000000");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_COLORS_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const addFavorite = (color: string) => {
    const newFavs = [color, ...favorites.filter(c => c !== color)].slice(0, 10);
    setFavorites(newFavs);
    localStorage.setItem(LOCAL_STORAGE_COLORS_KEY, JSON.stringify(newFavs));
  };

  const handleCustomApply = () => {
    addFavorite(customColor);
    onSelect(customColor);
  };

  return (
    <div
      className="absolute top-[calc(100%+4px)] left-0 z-50 bg-[#FFFBF1] border border-[#E8DAC0] rounded-xl shadow-xl p-3 flex flex-col gap-3 w-64"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="Temizle"
        onClick={(e) => {
          e.preventDefault();
          onSelect("");
        }}
        className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-sm font-semibold text-[#6B5C4A] transition-colors"
      >
        <Icons.Clear /> Rengi Temizle
      </button>

      <div>
        <div className="text-[10px] font-bold text-[#6B5C4A]/60 uppercase tracking-widest mb-2 px-1">Hazır Renkler</div>
        <div className="flex gap-2 flex-wrap px-1">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={(e) => {
                e.preventDefault();
                onSelect(c.value);
              }}
              className="w-6 h-6 rounded-md border border-[#E8DAC0]/80 hover:scale-110 transition-transform shadow-sm"
              style={{ background: c.value }}
            />
          ))}
        </div>
      </div>

      {favorites.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-[#6B5C4A]/60 uppercase tracking-widest mb-2 px-1">Favoriler (Son Kullanılanlar)</div>
          <div className="flex gap-2 flex-wrap px-1">
            {favorites.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(c);
                }}
                className="w-6 h-6 rounded-md border border-[#E8DAC0]/80 hover:scale-110 transition-transform shadow-sm"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold text-[#6B5C4A]/60 uppercase tracking-widest mb-2 px-1">Özel Renk Seç (Hex/RGB)</div>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
          />
          <input 
             type="text" 
             value={customColor} 
             onChange={(e) => setCustomColor(e.target.value)} 
             className="flex-1 w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-md px-2 py-1.5 text-xs text-[#3A2E22] font-mono outline-none shadow-sm transition-colors"
             placeholder="#000000"
          />
          <button 
             type="button" 
             onClick={handleCustomApply}
             className="px-3 py-1.5 bg-[#EFCB88] hover:bg-[#EFCB88]/90 text-[#3A2E22] rounded-md text-xs font-bold transition-colors shadow-sm"
          >
             Uygula
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────────────
interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "İçeriğinizi buraya yazın...",
}: RichEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [, forceRender] = useState(0);

  const lastValue = useRef(value);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "editor-link",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
      });
      lastValue.current = clean;
      onChange(clean);
    },
    editorProps: {
      attributes: {
        class: "rt-editor-area",
        spellcheck: "true",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value without caret jump
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValue.current) {
      lastValue.current = value;
      const current = editor.getHTML();
      if (value !== current) {
        editor.commands.setContent(value || "", false);
      }
    }
  }, [value, editor]);

  // Re-render toolbar on selection/transaction change
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceRender((v) => v + 1);
    editor.on("transaction", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("transaction", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  // Close popups on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setColorOpen(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(event.target as Node)) {
        setHighlightOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openLink = useCallback(() => setLinkOpen(true), []);

  const applyLink = useCallback(
    (url: string) => {
      setLinkOpen(false);
      if (!editor) return;
      if (!url) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const href = url.startsWith("http") ? url : `https://${url}`;
      editor.chain().focus().setLink({ href }).run();
    },
    [editor]
  );

  if (!editor) return null;

  const words = (editor.storage?.characterCount?.words?.() as number) ?? 0;
  const chars = (editor.storage?.characterCount?.characters?.() as number) ?? 0;
  const currentLink = editor.getAttributes("link").href ?? "";

  return (
    <>
      <LinkDialog open={linkOpen} initial={currentLink} onConfirm={applyLink} onClose={() => setLinkOpen(false)} />

      <div className="flex flex-col border border-[#E8DAC0] rounded-2xl overflow-hidden bg-[#FFFDF5] transition-all focus-within:border-[#EFCB88] focus-within:ring-2 focus-within:ring-[#EFCB88]/20 shadow-sm">
        {/* ─── Toolbar ─── */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[#E8DAC0] bg-[#FFFBF1] min-h-[48px]">
          {/* Undo / Redo */}
          <Btn title="Geri Al" onClick={() => editor.chain().focus().undo().run()}>
            <Icons.Undo />
          </Btn>
          <Btn title="İleri Al" onClick={() => editor.chain().focus().redo().run()}>
            <Icons.Redo />
          </Btn>

          <Sep />

          {/* Headings */}
          <Btn title="Başlık 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <span className="font-bold text-[12px]">H1</span>
          </Btn>
          <Btn title="Başlık 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <span className="font-bold text-[12px]">H2</span>
          </Btn>
          <Btn title="Başlık 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <span className="font-bold text-[12px]">H3</span>
          </Btn>

          <Sep />

          {/* Text formatting */}
          <Btn title="Kalın" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Icons.Bold />
          </Btn>
          <Btn title="İtalik" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Icons.Italic />
          </Btn>
          <Btn title="Altı Çizili" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Icons.Underline />
          </Btn>
          <Btn title="Üstü Çizili" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Icons.Strike />
          </Btn>

          <Sep />

          {/* Text color */}
          <div className="relative" ref={colorRef}>
            <Btn
              title="Metin Rengi"
              active={colorOpen}
              onClick={() => {
                setHighlightOpen(false);
                setColorOpen((v) => !v);
              }}
            >
              <Icons.TextColor />
            </Btn>
            {colorOpen && (
              <ColorMenu
                colors={TEXT_COLORS}
                onSelect={(v) => {
                  if (!v) editor.chain().focus().unsetColor().run();
                  else editor.chain().focus().setColor(v).run();
                  setColorOpen(false);
                }}
              />
            )}
          </div>

          {/* Highlight */}
          <div className="relative" ref={highlightRef}>
            <Btn
              title="Arka Plan Rengi"
              active={highlightOpen || editor.isActive("highlight")}
              onClick={() => {
                setColorOpen(false);
                setHighlightOpen((v) => !v);
              }}
            >
              <Icons.Highlight />
            </Btn>
            {highlightOpen && (
              <ColorMenu
                colors={HIGHLIGHT_COLORS}
                onSelect={(v) => {
                  if (!v) editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color: v }).run();
                  setHighlightOpen(false);
                }}
              />
            )}
          </div>

          <Sep />

          {/* Lists */}
          <Btn title="Madde İşaretli Liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <Icons.ListBullet />
          </Btn>
          <Btn title="Numaralı Liste" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <Icons.ListNumber />
          </Btn>

          <Sep />

          {/* Block elements */}
          <Btn title="Alıntı" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Icons.Quote />
          </Btn>
          <Btn title="Kod Bloğu" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Icons.Code />
          </Btn>
          <Btn title="Yatay Çizgi" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Icons.Rule />
          </Btn>

          <Sep />

          {/* Link */}
          <Btn title="Bağlantı Ekle" active={editor.isActive("link")} onClick={openLink}>
            <Icons.Link />
          </Btn>
          {editor.isActive("link") && (
            <Btn title="Bağlantıyı Kaldır" onClick={() => editor.chain().focus().unsetLink().run()}>
              <Icons.Unlink />
            </Btn>
          )}

          {/* Word/char counter */}
          <span className="ml-auto text-[#6B5C4A]/40 text-xs font-medium font-mono select-none pr-1 whitespace-nowrap">
            {words} kelime
          </span>
        </div>

        {/* ─── Editor content area ─── */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 400, maxHeight: 800 }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <style>{`
        .rt-editor-area {
          padding: 2rem;
          min-height: 400px;
          color: #3A2E22;
          font-family: "Raleway", Georgia, serif;
          font-size: 1rem;
          line-height: 1.8;
          outline: none;
          word-break: break-word;
        }
        .rt-editor-area h1 { font-size: 2rem; font-weight: 800; color: #3A2E22; margin: 2rem 0 1rem; line-height: 1.25; }
        .rt-editor-area h2 { font-size: 1.5rem; font-weight: 700; color: #3A2E22; margin: 1.5rem 0 0.75rem; }
        .rt-editor-area h3 { font-size: 1.25rem; font-weight: 700; color: #3A2E22; margin: 1.25rem 0 0.5rem; }
        .rt-editor-area p  { margin: 0 0 1rem; }
        .rt-editor-area p:last-child { margin-bottom: 0; }
        .rt-editor-area strong { font-weight: 700; }
        .rt-editor-area em { font-style: italic; }
        .rt-editor-area u  { text-decoration: underline; text-underline-offset: 2px; }
        .rt-editor-area s  { text-decoration: line-through; }
        .rt-editor-area a, .editor-link { color: #A56A00; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; transition: color 0.2s; }
        .rt-editor-area a:hover, .editor-link:hover { color: #8C5A00; }
        .rt-editor-area blockquote {
          border-left: 4px solid #EFCB88;
          background-color: #FFFBF1;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          color: #6B5C4A;
          font-style: italic;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .rt-editor-area pre {
          background: #3A2E22; color: #EFCB88;
          border-radius: 0.75rem; padding: 1.25rem;
          font-family: monospace; font-size: 0.875rem;
          margin: 1.5rem 0; overflow-x: auto;
          line-height: 1.5;
        }
        .rt-editor-area code {
          background: #E8DAC0; border-radius: 0.25rem;
          padding: 0.2em 0.4em;
          font-family: monospace; font-size: 0.875em; color: #A56A00;
        }
        .rt-editor-area pre code { background: none; padding: 0; color: inherit; font-size: 1em; }
        .rt-editor-area ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
        .rt-editor-area ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
        .rt-editor-area li { margin: 0.5rem 0; padding-left: 0.5rem; }
        .rt-editor-area li p { margin: 0; }
        .rt-editor-area hr { border: none; border-top: 2px solid #E8DAC0; margin: 2rem 0; }
        /* Placeholder */
        .rt-editor-area.is-editor-empty:before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(107, 92, 74, 0.4);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        /* ProseMirror focus reset */
        .ProseMirror { outline: none !important; }
        .ProseMirror-focused { outline: none !important; }
      `}</style>
    </>
  );
}
