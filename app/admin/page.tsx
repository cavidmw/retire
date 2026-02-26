"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getBlogs, saveBlog, deleteBlog, generateId, BlogPost } from "@/lib/data";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";

// Render editor strictly on client to avoid SSR hydration mismatches
const ClientEditor = dynamic(() => Promise.resolve(Editor), { ssr: false });

const ADMIN_PASSWORD = "townwise2025";

const emptyForm = (): Omit<BlogPost, "id" | "slug"> => ({
  title: "",
  summary: "",
  content: "",
  coverImage: "",
  videoUrl: "",
  publishedAt: new Date().toISOString().split("T")[0],
});

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "editor">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (authed) setBlogs(getBlogs());
  }, [authed]);

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const id = editingId || generateId();
    const post: BlogPost = { ...form, id, slug: id };
    saveBlog(post);
    setBlogs(getBlogs());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm(emptyForm());
    setEditingId(null);
    setActiveTab("list");
  };

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      summary: post.summary,
      content: post.content,
      coverImage: post.coverImage,
      videoUrl: post.videoUrl || "",
      publishedAt: post.publishedAt,
    });
    setActiveTab("editor");
  };

  const handleDelete = (id: string) => {
    deleteBlog(id);
    setBlogs(getBlogs());
    setDeleteConfirm(null);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
      setActiveTab("list");
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveTab("editor");
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-[#FFFBF1] border border-[#E8DAC0] rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="Retire Townwise logo"
              width={40}
              height={40}
              className="rounded-full border border-[#EFCB88]/60 bg-[#FFFBF1] object-cover flex-shrink-0"
              priority
            />
            <div>
              <h1 className="text-[#3A2E22] font-bold text-base">Admin Panel</h1>
              <p className="text-[#6B5C4A]/70 text-xs">Retire Townwise</p>
            </div>
          </div>
          <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            className={`w-full bg-[#FFFDF5] border rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors duration-200 focus:border-[#EFCB88] ${
              pwError ? "border-red-500/60" : "border-[#E8DAC0]"
            }`}
          />
          {pwError && (
            <p className="text-red-400 text-xs mt-2">Incorrect password.</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-[#EFCB88] hover:bg-[#EFCB88]/90 text-[#3A2E22] font-bold py-3 rounded-xl text-sm transition-colors duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-[#FFF6DA]/95 border-b border-[#E8DAC0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Retire Townwise logo"
            width={32}
            height={32}
            className="rounded-full border border-[#EFCB88]/60 bg-[#FFFBF1] object-cover flex-shrink-0"
            priority
          />
          <span className="text-[#A56A00] font-bold text-sm">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="text-[#6B5C4A]/70 hover:text-[#6B5C4A] text-xs flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Site
          </a>
          <button
            onClick={() => setAuthed(false)}
            className="text-[#6B5C4A]/70 hover:text-red-500 text-xs transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-[#FFFBF1] border border-[#E8DAC0] rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "list"
                ? "bg-[#EFCB88] text-[#3A2E22]"
                : "text-[#6B5C4A]/80 hover:text-[#3A2E22]"
            }`}
          >
            All Posts ({blogs.length})
          </button>
          <button
            onClick={handleNew}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === "editor"
                ? "bg-[#EFCB88] text-[#3A2E22]"
                : "text-[#6B5C4A]/80 hover:text-[#3A2E22]"
            }`}
          >
            {editingId ? "Edit Post" : "+ New Post"}
          </button>
        </div>

        {/* List view */}
        {activeTab === "list" && (
          <div className="space-y-3">
            {blogs.length === 0 && (
              <div className="text-center py-16 text-[#6B5C4A]/50">
                <p className="text-lg mb-2">No posts yet</p>
                <button onClick={handleNew} className="text-[#A56A00] text-sm hover:underline">
                  Create your first post
                </button>
              </div>
            )}
            {blogs.map((post) => (
              <div
                key={post.id}
                className="bg-[#FFFBF1] border border-[#E8DAC0] rounded-xl p-5 flex items-start gap-4 hover:border-[#A56A00]/30 transition-colors"
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#3A2E22] text-sm mb-1 truncate">{post.title}</h3>
                  <p className="text-[#6B5C4A]/70 text-xs mb-2 line-clamp-2">{post.summary}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[#4F8F4E] text-xs">{post.publishedAt}</span>
                    <span className="text-black/30 text-xs">ID: {post.id}</span>
                    <a
                      href={`/${post.id}`}
                      target="_blank"
                      className="text-[#8FA6BF] text-xs hover:underline"
                    >
                      View
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(post)}
                    className="px-3 py-1.5 bg-black/5 hover:bg-black/10 border border-[#E8DAC0] rounded-lg text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-black/5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="px-3 py-1.5 bg-black/5 hover:bg-red-500/10 border border-[#E8DAC0] hover:border-red-500/30 text-[#3A2E22]/80 hover:text-red-500 rounded-lg text-xs font-medium transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Editor view */}
        {activeTab === "editor" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Article title..."
                  className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  Summary
                </label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Short description shown on the blog card..."
                  rows={3}
                  className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  Cover Image
                </label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors mb-3"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setForm({ ...form, coverImage: String(reader.result || "") });
                      };
                      reader.readAsDataURL(f);
                    }}
                    className="block w-full text-sm text-[#3A2E22] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#EFCB88] file:text-[#3A2E22] hover:file:bg-[#EFCB88]/90"
                  />
                </div>
                {form.coverImage && (
                  <img
                    src={form.coverImage}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-[#E8DAC0]"
                  />
                )}
              </div>

              <div>
                <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm placeholder-black/40 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                  className="w-full bg-[#FFFDF5] border border-[#E8DAC0] focus:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.content.trim() || saving}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  saved
                    ? "bg-[#4F8F4E] text-white"
                    : form.title.trim() && form.content.trim()
                    ? "bg-[#EFCB88] hover:bg-[#EFCB88]/90 text-[#3A2E22]"
                    : "bg-black/5 text-black/30 cursor-not-allowed"
                }`}
              >
                {saved ? "✓ Saved!" : saving ? "Saving..." : editingId ? "Update Post" : "Publish Post"}
              </button>
            </div>

            <div>
              <label className="block text-[#6B5C4A]/80 text-xs font-semibold uppercase tracking-widest mb-2">
                Content *
              </label>
              <ClientEditor value={form.content} onChange={(html: string) => setForm({ ...form, content: html })} />
              <p className="text-[#6B5C4A]/60 text-xs mt-2">Use the toolbar to format text.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Editor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Write your content...",
        emptyEditorClass: "is-editor-empty text-[#6B5C4A]/60",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }: { editor: any }) => {
      const html = editor.getHTML();
      const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
      onChange(clean);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[600px] bg-[#FFFDF5] border border-[#E8DAC0] focus-within:border-[#EFCB88] rounded-xl px-4 py-3 text-[#3A2E22] text-sm outline-none leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (incoming !== current) {
      editor.commands.setContent(incoming, false);  
    }
  }, [value, editor]);

  // Force re-render on selection/transaction to update toolbar active states
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => force((v) => v + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  const Button = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1 rounded transition-colors ${
        active ? "bg-[#EFCB88]/60 text-[#3A2E22]" : "hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-[#FFFBF1] border border-[#E8DAC0] rounded-lg p-2">
        <Button
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </Button>
        <Button
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            title="H2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Button>
          <Button
            title="H3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </Button>
          <Button
            title="Bullet List"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • UL
          </Button>
          <Button
            title="Ordered List"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. OL
          </Button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          min-height: 600px;
          padding: 0;
          outline: none;
        }
        .ProseMirror p { margin: 0 0 0.75rem 0; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #3A2E22; }
        .ProseMirror h3 { font-size: 1.125rem; font-weight: 700; margin: 0.75rem 0 0.5rem; color: #3A2E22; }
        .ProseMirror ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0 0.75rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0 0.75rem; }
        .ProseMirror li { margin: 0.25rem 0; }
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(107, 92, 74, 0.6);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
