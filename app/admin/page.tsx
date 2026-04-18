"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { BlogPost } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post extends BlogPost {
  status?: "published" | "draft";
  updatedAt?: string;
}

type Tab = "list" | "editor" | "messages" | "analytics";
type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Dynamic imports (client-only) ────────────────────────────────────────────
const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), { ssr: false });

// ─── ContactMessage ───────────────────────────────────────────────────────────
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ip_address?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LS_DRAFT_KEY = "rt_admin_draft";

const emptyForm = (): Omit<Post, "id" | "slug"> => ({
  title: "",
  summary: "",
  content: "",
  coverImage: "",
  videoUrl: "",
  publishedAt: new Date().toISOString().split("T")[0],
  status: "draft",
});

function saveDraftLocally(editingId: string | null, form: ReturnType<typeof emptyForm>) {
  try {
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify({ editingId, form, savedAt: Date.now() }));
  } catch {}
}

function loadDraftLocally(): { editingId: string | null; form: ReturnType<typeof emptyForm>; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(LS_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraftLocally() {
  try { localStorage.removeItem(LS_DRAFT_KEY); } catch {}
}

function hasUnsavedChanges(form: ReturnType<typeof emptyForm>, savedForm: ReturnType<typeof emptyForm>) {
  return (
    form.title !== savedForm.title ||
    form.summary !== savedForm.summary ||
    form.content !== savedForm.content ||
    form.coverImage !== savedForm.coverImage ||
    form.videoUrl !== savedForm.videoUrl ||
    form.publishedAt !== savedForm.publishedAt
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  EyeOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
  ExternalLink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>,
  LogOut: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
  BarChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
};

// ─── Preview component — mirrors blog detail page ─────────────────────────────
function LivePreview({ form }: { form: ReturnType<typeof emptyForm> }) {
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };
  const videoId = form.videoUrl ? getYouTubeId(form.videoUrl) : null;
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  const dateStr = form.publishedAt
    ? new Date(form.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="bg-[#FFF6DA] rounded-2xl overflow-hidden border border-[#E8DAC0] shadow-sm max-w-[800px] mx-auto w-full">
      {/* Preview header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFFBF1] border-b border-[#E8DAC0]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-[#6B5C4A]/60 text-xs ml-1 font-medium tracking-wide">Live Preview</span>
      </div>

      <div className="bg-[#FFFDF5]">
        {/* Cover image (16:9 ratio container) */}
        {form.coverImage && (
          <div className="relative w-full aspect-video bg-[#E8DAC0]/20">
            <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#FFFDF5]" />
          </div>
        )}

        <div className="px-8 pb-12" style={{ marginTop: form.coverImage ? -60 : 40 }}>
          {/* Meta */}
          <div className="relative z-10 mb-8">
            {dateStr && (
              <p className="text-[#4F8F4E] text-sm font-bold uppercase tracking-widest mb-3">{dateStr}</p>
            )}
            <h1 className="text-4xl font-extrabold text-[#3A2E22] leading-tight mb-4">
              {form.title || <span className="text-[#6B5C4A]/30 italic">Article title...</span>}
            </h1>
            {form.summary && (
              <p className="text-[#6B5C4A]/85 text-lg leading-relaxed border-l-4 border-[#A56A00] pl-4 italic">
                {form.summary}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[#E8DAC0]/10 via-[#A56A00]/20 to-[#E8DAC0]/10 mb-8" />

          {/* Content */}
          {form.content ? (
            <div
              className="blog-content preview-content text-base"
              dangerouslySetInnerHTML={{ __html: form.content }}
            />
          ) : (
            <p className="text-[#6B5C4A]/30 italic text-base">Your content will appear here...</p>
          )}

          {/* Video */}
          {videoId && (
            <div className="mt-8">
              <div className="w-full rounded-2xl overflow-hidden border border-[#E8DAC0] shadow-lg relative aspect-video group cursor-pointer">
                <img src={thumbnail!} alt="YouTube" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-[#FF0000] flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110">
                    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview CSS */}
      <style>{`
        .preview-content { color: #3A2E22; font-family: "Raleway", Georgia, serif; line-height: 1.8; }
        .preview-content h1 { font-size: 2rem; font-weight: 800; margin: 2rem 0 1rem; }
        .preview-content h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .preview-content h3 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
        .preview-content p  { margin: 0 0 1rem; }
        .preview-content strong { font-weight: 700; }
        .preview-content em { font-style: italic; }
        .preview-content a  { color: #A56A00; text-decoration: underline; text-underline-offset: 4px; }
        .preview-content blockquote {
          border-left: 4px solid #EFCB88;
          background-color: #FFFBF1;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          color: #6B5C4A;
          font-style: italic;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .preview-content pre {
          background: #3A2E22; color: #EFCB88; border-radius: 0.75rem;
          padding: 1.25rem; font-family: monospace; font-size: 0.9rem;
          margin: 1.5rem 0; overflow-x: auto; line-height: 1.5;
        }
        .preview-content code { background: #E8DAC0; border-radius: 4px; padding: 0.2em 0.4em; font-family: monospace; font-size: 0.9em; color: #A56A00; }
        .preview-content pre code { background: none; padding: 0; color: inherit; font-size: 1em; }
        .preview-content ul { list-style: disc; padding-left: 1.5rem; margin: 1rem 0; }
        .preview-content ol { list-style: decimal; padding-left: 1.5rem; margin: 1rem 0; }
        .preview-content li { margin: 0.5rem 0; padding-left: 0.5rem; }
        .preview-content li p { margin: 0; }
        .preview-content hr { border: none; border-top: 2px solid #E8DAC0; margin: 2rem 0; }
      `}</style>
    </div>
  );
}

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<{ url?: string; error?: string }> {
  if (file.size > 10 * 1024 * 1024) return { error: "Dosya çok büyük (max 10MB)." };
  const fd = new FormData();
  fd.append("file", file);
  try {
    const resp = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await resp.json();
    if (!resp.ok || data?.ok === false) return { error: data?.error || "Yükleme başarısız." };
    return { url: data.url };
  } catch (e: any) {
    return { error: e?.message || "Yükleme sırasında hata." };
  }
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  // ── auth
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // ── data
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // ── editor state
  const [form, setForm] = useState(emptyForm());
  const [savedForm, setSavedForm] = useState(emptyForm()); // last DB-saved snapshot
  const [editingIdState, setEditingIdState] = useState<string | null>(null);
  const editingIdRef = useRef<string | null>(null);
  
  const setEditingId = (id: string | null) => {
    setEditingIdState(id);
    editingIdRef.current = id;
  };
  const editingId = editingIdState;

  // ── ui state
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // ── messages ui
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [msgDeleteConfirm, setMsgDeleteConfirm] = useState<string | null>(null);

  // ── autosave
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSavedRef = useRef<string>(""); // JSON snapshot of last autosaved form

  // ── fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/posts");
      const d = await r.json().catch(() => ({ items: [] }));
      setPosts(d.items || []);
    } catch { setPosts([]); }
  }, []);

  // ── fetch messages ──────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const r = await fetch("/api/admin/messages");
      const d = await r.json().catch(() => ({ messages: [] }));
      setMessages(d.messages || []);
    } catch { setMessages([]); } finally { setMessagesLoading(false); }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchPosts();
    fetchMessages();
  }, [authed, fetchPosts, fetchMessages]);

  useEffect(() => {
    if (authed && activeTab === "messages") fetchMessages();
  }, [authed, activeTab, fetchMessages]);

  // ── Restore local draft on Login ─────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    const local = loadDraftLocally();
    if (local && (local.form.title || local.form.content)) {
      const age = Date.now() - local.savedAt;
      if (age < 7 * 24 * 60 * 60 * 1000) { // < 7 days
        setDraftRestored(true);
      }
    }
  }, [authed]);

  // ── Unsaved changes guard ────────────────────────────────────────────────
  const isDirty = useCallback(() => {
    return activeTab === "editor" && hasUnsavedChanges(form, savedForm);
  }, [activeTab, form, savedForm]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Autosave to localStorage (debounced 2s) ──────────────────────────────
  useEffect(() => {
    if (activeTab !== "editor") return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveDraftLocally(editingId, form);
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [form, editingId, activeTab]);

  // ── Autosave to DB (debounced 5s) ─────────────────────────────────────────
  const dbAutosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (activeTab !== "editor") return;

    // Only autosave to DB if we have content or a title
    if (!form.title.trim() && !form.content.trim()) return;

    const snapshot = JSON.stringify(form);
    if (snapshot === lastAutoSavedRef.current) return;

    if (dbAutosaveTimer.current) clearTimeout(dbAutosaveTimer.current);
    dbAutosaveTimer.current = setTimeout(async () => {
      const curr = JSON.stringify(form);
      if (curr === lastAutoSavedRef.current || isSavingRef.current) return;
      
      lastAutoSavedRef.current = curr;
      setSaveStatus("saving");
      isSavingRef.current = true;

      try {
        const currentEditingId = editingIdRef.current;
        const method = currentEditingId ? "PUT" : "POST";
        const r = await fetch("/api/admin/posts", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentEditingId || undefined,
            title: form.title,
            summary: form.summary,
            content: form.content,
            coverImage: form.coverImage,
            videoUrl: form.videoUrl,
            publishedAt: form.publishedAt,
            status: "draft", // Background saves always save as draft
          }),
        });

        if (r.ok) {
          const json = await r.json();
          setSaveStatus("saved");
          
          if (!currentEditingId && json.item?.id) {
            setEditingId(json.item.id);
          }
          
          // Don't update savedForm to not disrupt "published" vs "draft" logic for the final save
          setTimeout(() => setSaveStatus("idle"), 2000);
          fetchPosts(); // Silently refresh post list in background
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    }, 5000);

    return () => { if (dbAutosaveTimer.current) clearTimeout(dbAutosaveTimer.current); };
  }, [form, activeTab, fetchPosts]);

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!pw.trim() || loggingIn) return;
    setLoggingIn(true);
    setPwError(false);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) { setAuthed(true); setPw(""); }
      else setPwError(true);
    } catch { setPwError(true); }
    finally { setLoggingIn(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setPw("");
  };

  // ── New post ─────────────────────────────────────────────────────────────
  const handleNew = () => {
    if (isDirty()) {
      if (!confirm("Kaydedilmemiş değişiklikler var. Yine de yeni yazıya geçmek istiyor musun?")) return;
    }
    const blank = emptyForm();
    setForm(blank);
    setSavedForm(blank);
    setEditingId(null);
    setSaveError(null);
    setCoverError(null);
    lastAutoSavedRef.current = "";
    setActiveTab("editor");
  };

  // ── Edit post ─────────────────────────────────────────────────────────────
  const handleEdit = (post: Post) => {
    if (isDirty()) {
      if (!confirm("Kaydedilmemiş değişiklikler var. Yine de geçmek istiyor musun?")) return;
    }
    const f = {
      title: post.title,
      summary: post.summary,
      content: post.content,
      coverImage: post.coverImage,
      videoUrl: post.videoUrl || "",
      publishedAt: post.publishedAt,
      status: post.status ?? "published",
    };
    setForm(f);
    setSavedForm(f);
    setEditingId(post.id);
    setSaveError(null);
    setCoverError(null);
    lastAutoSavedRef.current = JSON.stringify(f);
    setActiveTab("editor");
  };

  // ── Save (Publish or Draft explicitly via action if needed) ────────────────
  const handleSave = async (statusOverride?: "published" | "draft") => {
    if (!form.title.trim() && !form.content.trim()) {
      setSaveError("Başlık veya içerik boş olamaz.");
      return;
    }
    if (typeof form.coverImage === "string" && form.coverImage.startsWith("data:")) {
      setCoverError("Base64 görsel desteklenmiyor. Dosya yükleyin.");
      return;
    }
    setSaveError(null);
    setCoverError(null);
    setSaveStatus("saving");

    const status = statusOverride ?? form.status ?? "draft";
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      coverImage: form.coverImage,
      videoUrl: form.videoUrl,
      publishedAt: form.publishedAt,
      status,
      id: editingId || undefined,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const r = await fetch("/api/admin/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await r.json().catch(() => ({}));

      if (!r.ok || json?.ok === false) {
        setSaveStatus("error");
        setSaveError(json?.error || json?.details || "Kayıt başarısız.");
        return;
      }

      // On new post — set ID for subsequent autosaves
      if (!editingId && json.item?.id) setEditingId(json.item.id);

      setSavedForm({ ...form, status });
      setForm((prev) => ({ ...prev, status }));
      lastAutoSavedRef.current = JSON.stringify({ ...form, status });
      clearDraftLocally();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
      await fetchPosts();

      if (status === "published") {
        setActiveTab("list");
        setEditingId(null);
        const blank = emptyForm();
        setForm(blank);
        setSavedForm(blank);
      }
    } catch (err: any) {
      setSaveStatus("error");
      setSaveError(err?.message || "Sunucu hatası.");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleteConfirm(null);
    if (editingId === id) {
      const blank = emptyForm();
      setForm(blank);
      setSavedForm(blank);
      setEditingId(null);
      setActiveTab("list");
    }
    await fetchPosts();
  };

  // ── Messages ─────────────────────────────────────────────────────────────
  const handleMarkRead = async (id: string, is_read: boolean) => {
    setMessages((p) => p.map((m) => (m.id === id ? { ...m, is_read } : m)));
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_read }),
    }).catch(() => null);
  };

  const handleDeleteMessage = async (id: string) => {
    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setMessages((p) => p.filter((m) => m.id !== id));
    setMsgDeleteConfirm(null);
    if (expandedMsg === id) setExpandedMsg(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="rounded-full border border-[#EFCB88]/60 object-cover flex-shrink-0" priority />
            <div>
              <h1 className="text-[#3A2E22] font-bold text-base">Admin Panel</h1>
              <p className="text-[#6B5C4A]/70 text-xs">Retire Townwise</p>
            </div>
          </div>
          <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
          <input
            type="password" value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className={`w-full bg-[#FFFDF5] border rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors duration-200 focus:border-[#EFCB88] ${pwError ? "border-red-500/60" : "border-[#E8DAC0]"}`}
          />
          {pwError && <p className="text-red-400 text-xs mt-2 font-medium flex items-center gap-1.5"><Icons.Info /> Hatalı şifre.</p>}
          <button onClick={handleLogin} disabled={loggingIn || !pw.trim()}
            className="w-full mt-4 bg-[#EFCB88] hover:bg-[#EFCB88]/90 text-[#3A2E22] font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {loggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN PANEL
  // ─────────────────────────────────────────────────────────────────────────────
  const unreadCount = messages.filter((m) => !m.is_read).length;
  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status !== "draft");

  return (
    <div className="min-h-screen">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="bg-[#FFF6DA]/95 border-b border-[#E8DAC0] px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={30} height={30} className="rounded-full border border-[#EFCB88]/60 object-cover flex-shrink-0" priority />
          <span className="text-[#A56A00] font-bold text-sm">Admin Panel</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/" target="_blank" className="text-[#6B5C4A]/70 hover:text-[#3A2E22] text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Icons.ExternalLink />
            Siteyi Gör
          </a>
          <div className="w-px h-4 bg-[#E8DAC0]"></div>
          <button onClick={handleLogout} className="text-[#6B5C4A]/70 hover:text-red-600 text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Icons.LogOut />
            Çıkış
          </button>
        </div>
      </header>

      {/* ── Draft restored banner ──────────────────────────────────────── */}
      {draftRestored && activeTab !== "editor" && (
        <div className="bg-[#EFCB88]/20 border-b border-[#EFCB88]/40 px-6 py-2.5 flex items-center gap-3">
          <span className="text-[#A56A00] text-xs font-semibold flex items-center gap-1.5">
            <Icons.FileText /> Kaydedilmemiş taslak bulundu
          </span>
          <button
            onClick={() => {
              const local = loadDraftLocally();
              if (!local) return;
              setForm(local.form);
              setSavedForm(emptyForm());
              setEditingId(local.editingId);
              setActiveTab("editor");
              setDraftRestored(false);
            }}
            className="text-[#A56A00] text-xs font-medium underline hover:no-underline"
          >
            Devam et
          </button>
          <button onClick={() => { clearDraftLocally(); setDraftRestored(false); }} className="text-[#6B5C4A]/60 hover:text-[#6B5C4A] text-xs font-medium underline ml-auto transition-colors">
            Yoksay
          </button>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mb-8 bg-[#FFFBF1] border border-[#E8DAC0] rounded-xl p-1.5 w-fit shadow-sm">
          <button onClick={() => setActiveTab("list")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "list" ? "bg-[#EFCB88] text-[#3A2E22] shadow-sm" : "text-[#6B5C4A]/80 hover:text-[#3A2E22] hover:bg-[#E8DAC0]/30"}`}>
            <Icons.FileText />
            Yazılar ({published.length})
          </button>
          <button onClick={handleNew}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "editor" ? "bg-[#EFCB88] text-[#3A2E22] shadow-sm" : "text-[#6B5C4A]/80 hover:text-[#3A2E22] hover:bg-[#E8DAC0]/30"}`}>
            {editingId ? <><Icons.Edit /> Düzenle</> : <><Icons.Plus /> Yeni Yazı</>}
          </button>
          {drafts.length > 0 && (
            <button onClick={() => setActiveTab("list")}
              className="px-5 py-2 text-sm font-semibold rounded-lg text-[#A56A00] hover:bg-[#EFCB88]/20 transition-all relative flex items-center gap-2">
              Taslaklar
              <span className="ml-1 text-[10px] bg-[#EFCB88] text-[#3A2E22] rounded-full px-2 py-0.5 font-bold">{drafts.length}</span>
            </button>
          )}
          <div className="w-px h-6 bg-[#E8DAC0] mx-1"></div>
          <button onClick={() => setActiveTab("messages")}
            className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "messages" ? "bg-[#EFCB88] text-[#3A2E22] shadow-sm" : "text-[#6B5C4A]/80 hover:text-[#3A2E22] hover:bg-[#E8DAC0]/30"}`}>
            <Icons.Info />
            Mesajlar
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FFFBF1]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <div className="w-px h-6 bg-[#E8DAC0] mx-1"></div>
          <button onClick={() => setActiveTab("analytics")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === "analytics" ? "bg-[#EFCB88] text-[#3A2E22] shadow-sm" : "text-[#6B5C4A]/80 hover:text-[#3A2E22] hover:bg-[#E8DAC0]/30"}`}>
            <Icons.BarChart />
            Analizler
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LIST TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "list" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Published */}
            <div>
              <h2 className="text-[#3A2E22] font-bold text-base mb-4 flex items-center gap-2">
                <Icons.Globe /> Yayında ({published.length})
              </h2>
              {published.length === 0 && (
                <div className="text-center py-12 text-[#6B5C4A]/60 bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl border-dashed">
                  <p className="mb-3 font-medium">Henüz yayınlanmış yazı yok.</p>
                  <button onClick={handleNew} className="text-[#A56A00] text-sm font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto">
                    <Icons.Plus /> İlk yazıyı oluştur
                  </button>
                </div>
              )}
              <div className="grid gap-3">
                {published.map((post) => (
                  <PostRow key={post.id} post={post} onEdit={handleEdit} onDelete={(id) => setDeleteConfirm(id)}
                    deleteConfirm={deleteConfirm} onConfirmDelete={handleDelete} onCancelDelete={() => setDeleteConfirm(null)} />
                ))}
              </div>
            </div>

            {/* Drafts */}
            {drafts.length > 0 && (
              <div>
                <h2 className="text-[#3A2E22] font-bold text-base mb-4 flex items-center gap-2">
                  <Icons.Edit /> Taslaklar ({drafts.length})
                </h2>
                <div className="grid gap-3">
                  {drafts.map((post) => (
                    <PostRow key={post.id} post={post} onEdit={handleEdit} onDelete={(id) => setDeleteConfirm(id)}
                      deleteConfirm={deleteConfirm} onConfirmDelete={handleDelete} onCancelDelete={() => setDeleteConfirm(null)} isDraft />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            EDITOR TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "editor" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Top action bar: clear separation of post management actions */}
            <div className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFCB88]/20 flex items-center justify-center text-[#A56A00]">
                  <Icons.Edit />
                </div>
                <div>
                  <h2 className="text-[#3A2E22] font-bold text-base leading-none mb-1.5">
                    {editingId ? "Yazıyı Düzenle" : "Yeni Yazı Oluştur"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${form.status === "draft" ? "bg-[#E8DAC0]/50 text-[#6B5C4A]" : "bg-[#4F8F4E]/15 text-[#4F8F4E]"}`}>
                      {form.status === "draft" ? "TASLAK" : "YAYINDA"}
                    </span>
                    {/* Autosave indicator */}
                    <span className={`text-[11px] font-medium transition-all flex items-center gap-1 ${
                      saveStatus === "saving" ? "text-[#A56A00] animate-pulse" :
                      saveStatus === "saved" ? "text-[#4F8F4E]" :
                      saveStatus === "error" ? "text-red-500" :
                      "text-transparent"
                    }`}>
                      {saveStatus === "saving" ? <><Icons.Refresh /> Kaydediliyor...</> :
                       saveStatus === "saved" ? <><Icons.Check /> Kaydedildi</> :
                       saveStatus === "error" ? <><Icons.X /> Hata</> : ""}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Preview toggle */}
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${showPreview ? "bg-[#3A2E22] text-[#EFCB88] border-[#3A2E22] shadow-md" : "bg-[#FFFDF5] text-[#6B5C4A] border-[#E8DAC0] hover:border-[#A56A00]/40 hover:text-[#3A2E22]"}`}
                >
                  {showPreview ? <><Icons.EyeOff /> Önizlemeyi Kapat</> : <><Icons.Eye /> Canlı Önizleme</>}
                </button>
                
                {/* Save Draft Action - Demoted visually, mostly autosave handles it, but keeps explicit option */}
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#FFFDF5] border border-[#E8DAC0] hover:bg-[#E8DAC0]/20 text-[#6B5C4A] transition-all disabled:opacity-50"
                  title="Manuel Taslak Kaydet"
                >
                  Taslak Olarak Bırak
                </button>

                {/* Publish Action - Primary CTA */}
                <button
                  onClick={() => handleSave("published")}
                  disabled={saveStatus === "saving" || !form.title.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-[#4F8F4E] hover:bg-[#4F8F4E]/90 text-white transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  <Icons.Globe />
                  {editingId && form.status === "published" ? "Güncelle" : "Yayınla"}
                </button>
              </div>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium flex items-center gap-2">
                <Icons.Info /> {saveError}
              </div>
            )}

            {/* Editor Block */}
            <div className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col gap-6">
                {/* Title */}
                <div>
                  <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Yazı başlığı..."
                    className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-5 py-4 text-[#3A2E22] font-bold text-2xl placeholder-black/20 outline-none transition-all shadow-sm focus:shadow-md"
                  />
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-2">Özet (İsteğe Bağlı)</label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      placeholder="Blog listesinde görünecek kısa açıklama..."
                      rows={3}
                      className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/30 outline-none transition-all resize-none shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-2">Yayın Tarihi</label>
                      <input
                        type="date"
                        value={form.publishedAt}
                        onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                        className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-2.5 text-[#3A2E22] text-sm outline-none transition-all shadow-sm mb-4"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-2">YouTube Video URL (İsteğe Bağlı)</label>
                      <input
                        type="url"
                        value={form.videoUrl}
                        onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                        placeholder="Örn: https://youtube.com/watch?v=..."
                        className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-2.5 text-[#3A2E22] text-sm placeholder-black/30 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover image */}
                <div className="bg-[#FFFDF5] border border-[#E8DAC0] rounded-xl p-5 shadow-sm">
                  <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-3">Kapak Görseli</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                      <input
                        type="url"
                        value={form.coverImage}
                        onChange={(e) => { setCoverError(null); setForm({ ...form, coverImage: e.target.value }); }}
                        placeholder="Görsel URL'si yapıştırın veya cihazdan yükleyin..."
                        className="flex-1 bg-[#FFFBF1] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-2.5 text-[#3A2E22] text-sm placeholder-black/30 outline-none transition-all"
                      />
                      <label className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all border shadow-sm ${uploading ? "opacity-50 cursor-not-allowed border-[#E8DAC0] bg-[#FFFBF1] text-[#6B5C4A]" : "bg-[#EFCB88] hover:bg-[#EFCB88]/90 border-[#EFCB88] text-[#3A2E22]"}`}>
                        {uploading ? <><Icons.Refresh /> Yükleniyor...</> : <><Icons.Upload /> Cihazdan Seç</>}
                        <input type="file" accept="image/*" disabled={uploading} className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setCoverError(null);
                            setUploading(true);
                            const result = await uploadImage(f);
                            setUploading(false);
                            if (result.error) { setCoverError(result.error); return; }
                            if (result.url) setForm((p) => ({ ...p, coverImage: result.url! }));
                          }}
                        />
                      </label>
                    </div>
                    {form.coverImage && !form.coverImage.startsWith("data:") && (
                      <div className="sm:w-48 h-28 flex-shrink-0 rounded-xl border border-[#E8DAC0] overflow-hidden relative group">
                        <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => setForm(p => ({...p, coverImage: ""}))} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                             <Icons.Trash />
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {coverError && <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1.5"><Icons.Info /> {coverError}</p>}
                </div>

                {/* Rich Editor Block */}
                <div>
                  <label className="block text-[#6B5C4A]/80 text-[11px] font-bold uppercase tracking-widest mb-2">İçerik *</label>
                  <RichEditor
                    value={form.content}
                    onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                  />
                </div>
              </div>
            </div>

            {/* Bottom: Live Preview (Full width underneath) */}
            {showPreview && (
              <div className="mt-6 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <Icons.Eye />
                  <h3 className="text-[#3A2E22] font-bold text-lg">Canlı Önizleme</h3>
                  <div className="h-px bg-[#E8DAC0] flex-1 ml-4" />
                </div>
                <LivePreview form={form} />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MESSAGES TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "messages" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 bg-[#FFFBF1] border border-[#E8DAC0] p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFCB88]/20 flex items-center justify-center text-[#A56A00]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <div>
                  <span className="text-[#3A2E22] font-bold text-base block leading-none mb-1">{messages.length} Gelen Mesaj</span>
                  {unreadCount > 0 ? (
                     <span className="text-xs text-red-500 font-bold">{unreadCount} Okunmamış</span>
                  ) : (
                     <span className="text-xs text-[#6B5C4A]/60 font-medium">Tümü okundu</span>
                  )}
                </div>
              </div>
              <button onClick={fetchMessages} disabled={messagesLoading}
                className="px-4 py-2 bg-[#FFFDF5] border border-[#E8DAC0] hover:bg-[#E8DAC0]/30 rounded-xl text-[#3A2E22] text-sm font-semibold flex items-center gap-2 transition-colors">
                {messagesLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                ) : (
                  <Icons.Refresh />
                )}
                Yenile
              </button>
            </div>

            {!messagesLoading && messages.length === 0 && (
              <div className="text-center py-16 text-[#6B5C4A]/60 bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl border-dashed">
                <div className="w-16 h-16 bg-[#E8DAC0]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#A56A00]">
                  <Icons.Check />
                </div>
                <p className="text-lg font-bold mb-1 text-[#3A2E22]">Harika! Gelen kutusu boş.</p>
                <p className="text-sm">İletişim formundan gelen yeni mesajlar burada görünür.</p>
              </div>
            )}

            {messagesLoading && messages.length === 0 && (
              <div className="text-center py-16 text-[#6B5C4A]/50 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Mesajlar yükleniyor...
              </div>
            )}

            <div className="grid gap-3">
              {!messagesLoading && messages.map((msg) => {
                const isExpanded = expandedMsg === msg.id;
                const dateStr = new Date(msg.created_at).toLocaleString("tr-TR", {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={msg.id}
                    className={`bg-[#FFFBF1] border rounded-xl overflow-hidden transition-all duration-200 ${msg.is_read ? "border-[#E8DAC0]" : "border-[#EFCB88] shadow-md shadow-[#EFCB88]/10"}`}>
                    <div className="p-5 flex items-start gap-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                      onClick={() => {
                        const next = isExpanded ? null : msg.id;
                        setExpandedMsg(next);
                        if (!msg.is_read && next === msg.id) handleMarkRead(msg.id, true);
                      }}>
                      <div className="flex-shrink-0 mt-1.5">
                        {!msg.is_read ? <div className="w-3 h-3 rounded-full bg-[#A56A00] shadow-[0_0_8px_rgba(165,106,0,0.4)]" /> : <div className="w-3 h-3 rounded-full border-2 border-[#E8DAC0]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-base font-bold ${msg.is_read ? "text-[#3A2E22]/80" : "text-[#3A2E22]"}`}>{msg.name}</span>
                          <span className="text-[#E8DAC0] text-xs font-bold">•</span>
                          <span className="text-[#6B5C4A]/70 text-sm font-medium">{msg.email}</span>
                        </div>
                        <p className={`text-sm truncate mb-1.5 ${msg.is_read ? "text-[#6B5C4A]/80" : "text-[#3A2E22] font-bold"}`}>{msg.subject}</p>
                        {!isExpanded && <p className="text-[#6B5C4A]/60 text-sm line-clamp-1">{msg.message}</p>}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-3">
                        <span className="text-[#6B5C4A]/60 text-xs font-medium whitespace-nowrap bg-[#FFFDF5] px-2 py-1 rounded-md border border-[#E8DAC0]/50">{dateStr}</span>
                        <svg className={`w-5 h-5 text-[#6B5C4A]/40 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[#E8DAC0] px-6 pb-6 pt-5 bg-[#FFFDF5]">
                        <p className="text-[#3A2E22] text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className="flex items-center gap-3 mt-6 flex-wrap">
                          <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#4F8F4E]/10 hover:bg-[#4F8F4E]/20 border border-[#4F8F4E]/30 text-[#4F8F4E] rounded-xl text-sm font-bold transition-colors">
                            <Icons.ExternalLink /> E-posta ile Yanıtla
                          </a>
                          <button onClick={() => handleMarkRead(msg.id, !msg.is_read)}
                            className="px-4 py-2 bg-white hover:bg-black/5 border border-[#E8DAC0] rounded-xl text-sm font-semibold transition-colors text-[#6B5C4A]">
                            {msg.is_read ? "Okunmadı Olarak İşaretle" : "Okundu Olarak İşaretle"}
                          </button>
                          {msgDeleteConfirm === msg.id ? (
                            <div className="flex items-center gap-2 ml-auto bg-red-50 p-1.5 rounded-xl border border-red-100">
                              <span className="text-red-500 text-xs font-bold px-2">Silinsin mi?</span>
                              <button onClick={() => handleDeleteMessage(msg.id)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                                Evet
                              </button>
                              <button onClick={() => setMsgDeleteConfirm(null)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors">İptal</button>
                            </div>
                          ) : (
                            <button onClick={() => setMsgDeleteConfirm(msg.id)}
                              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 border border-[#E8DAC0] hover:border-red-200 text-[#6B5C4A] hover:text-red-500 rounded-xl text-sm font-semibold transition-all">
                              <Icons.Trash /> Sil
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ANALYTICS TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <AnalyticsChart />
        )}
      </div>
    </div>
  );
}

// ─── Post list row ───────────────────────────────────────────────────────────
function PostRow({
  post,
  onEdit,
  onDelete,
  deleteConfirm,
  onConfirmDelete,
  onCancelDelete,
  isDraft,
}: {
  post: Post;
  onEdit: (p: Post) => void;
  onDelete: (id: string) => void;
  deleteConfirm: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  isDraft?: boolean;
}) {
  return (
    <div className={`bg-[#FFFBF1] border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all shadow-sm hover:shadow-md ${isDraft ? "border-[#EFCB88]/60 bg-[#FFFDF5]" : "border-[#E8DAC0] hover:border-[#A56A00]/40"}`}>
      {post.coverImage ? (
        <div className="w-full sm:w-32 h-40 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border border-[#E8DAC0]">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full sm:w-32 h-40 sm:h-20 flex-shrink-0 rounded-lg bg-[#E8DAC0]/30 flex items-center justify-center border border-[#E8DAC0]/50 text-[#6B5C4A]/40">
           <Icons.FileText />
        </div>
      )}
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <h3 className="font-bold text-[#3A2E22] text-base truncate">{post.title || <em className="text-[#6B5C4A]/50 font-normal">Başlıksız Yazı</em>}</h3>
          {isDraft && <span className="flex-shrink-0 text-[10px] font-extrabold tracking-wider bg-[#EFCB88]/50 text-[#A56A00] px-2 py-0.5 rounded uppercase">Taslak</span>}
        </div>
        <p className="text-[#6B5C4A]/70 text-sm mb-3 line-clamp-2 leading-relaxed">{post.summary || <span className="italic opacity-50">Özet girilmemiş...</span>}</p>
        <div className="flex items-center gap-4">
          <span className="text-[#6B5C4A]/60 font-medium text-xs flex items-center gap-1.5"><Icons.Check /> {post.publishedAt}</span>
          {!isDraft && (
            <a href={`/${post.id}`} target="_blank" className="text-[#8FA6BF] text-xs font-bold hover:underline flex items-center gap-1">
              <Icons.ExternalLink /> Sitede Gör
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
        <button onClick={() => onEdit(post)} className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#E8DAC0]/30 border border-[#E8DAC0] rounded-xl text-sm font-bold text-[#3A2E22] transition-colors shadow-sm">
          <Icons.Edit /> Düzenle
        </button>
        {deleteConfirm === post.id ? (
          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-xl border border-red-100">
            <button onClick={() => onConfirmDelete(post.id)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              Sil
            </button>
            <button onClick={onCancelDelete} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">İptal</button>
          </div>
        ) : (
          <button onClick={() => onDelete(post.id)} className="flex items-center justify-center w-10 h-10 bg-white hover:bg-red-50 border border-[#E8DAC0] hover:border-red-200 text-[#6B5C4A] hover:text-red-500 rounded-xl transition-all shadow-sm">
            <Icons.Trash />
          </button>
        )}
      </div>
    </div>
  );
}
