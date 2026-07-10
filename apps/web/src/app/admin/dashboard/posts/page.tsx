'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/stores/admin-auth-store';
import { adminApi } from '@/lib/api';
import { Plus, Trash2, Edit3, Send, Archive, CheckCircle } from 'lucide-react';

interface AdminPost {
  id: string;
  title: string;
  content: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  createdAt: string;
  author: { name: string } | null;
}

export default function AdminPostsPage() {
  const token = useAdminAuthStore((s) => s.accessToken);

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Modal State
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('Announcement');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getPosts(token);
      if (res.success) {
        setPosts(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleOpenEdit = (post: AdminPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setType(post.type);
    setStatus(post.status);
    setIsCreateOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setType('Announcement');
    setStatus('DRAFT');
    setIsCreateOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitLoading(true);

    try {
      const payload = { title, content, type, status };
      let res;
      if (editingPost) {
        res = await adminApi.updatePost(editingPost.id, payload, token);
      } else {
        res = await adminApi.createPost(payload, token);
      }

      if (res.success) {
        fetchPosts();
        setIsCreateOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save admin post.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await adminApi.deletePost(postId, token);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Announcements Registry
        </span>
        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-xs shadow-md shadow-[#10B981]/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write Announcement</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Grid of posts */}
      {posts.length === 0 ? (
        <div className="border border-white/5 bg-white/[0.01] rounded-xl p-8 text-center text-slate-500 italic">
          No platform posts published yet. Use the tool above to compose announcements.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-6 shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border ${
                      post.status === 'PUBLISHED'
                        ? 'bg-emerald-950/15 border-emerald-500/20 text-[#10B981]'
                        : 'bg-slate-800 border-white/10 text-slate-400'
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                    {post.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{post.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">
                  By {post.author?.name || 'Admin'} &bull;{' '}
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(post)}
                    className="p-2 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded hover:bg-red-950/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composition Sheet Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0D18]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-[600px] rounded-xl border border-white/10 bg-[#121A2E] p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-white uppercase tracking-wide mb-6">
              {editingPost ? 'Edit Announcement Post' : 'Compose Platform Post'}
            </h3>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Post Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Welcome to Project Tutor!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Category Classification
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="Announcement" className="bg-[#121A2E]">
                      Announcement
                    </option>
                    <option value="Platform Update" className="bg-[#121A2E]">
                      Platform Update
                    </option>
                    <option value="Article" className="bg-[#121A2E]">
                      Educational Article
                    </option>
                    <option value="Release Notes" className="bg-[#121A2E]">
                      Release Notes
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Publish State
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-11 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="DRAFT" className="bg-[#121A2E]">
                      DRAFT (Keep Private)
                    </option>
                    <option value="PUBLISHED" className="bg-[#121A2E]">
                      PUBLISHED (Injected to Feed)
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Body Content
                </label>
                <textarea
                  required
                  placeholder="Describe your announcement updates..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full p-4 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981] placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-11 px-5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="h-11 px-6 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:bg-slate-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitLoading ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : status === 'PUBLISHED' ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  <span>
                    {editingPost
                      ? 'Apply Changes'
                      : status === 'PUBLISHED'
                        ? 'Publish Now'
                        : 'Save as Draft'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
