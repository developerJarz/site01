"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Pencil,
  ExternalLink,
} from "lucide-react";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: string;
}

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  author: "CarHat Team",
  tags: "",
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/admin/blogs?all=true");
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateForm = () => {
    setEditingBlog(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage,
      author: blog.author,
      tags: blog.tags?.join(", ") || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBlog(null);
    setFormData(emptyForm);
  };

  const saveBlog = async () => {
    if (!formData.title || !formData.excerpt || !formData.content || !formData.coverImage) {
      alert("Please fill in all required fields");
      return;
    }
    setActionLoading(editingBlog ? editingBlog._id : "new");
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingBlog) {
        // Update existing blog
        await fetch("/api/admin/blogs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingBlog._id, ...payload }),
        });
      } else {
        // Create new blog
        await fetch("/api/admin/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      fetchBlogs();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/blogs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, published: !published }),
      });
      fetchBlogs();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/blogs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchBlogs();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage blog posts ({blogs.length} total)
          </p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "New Post"}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {editingBlog ? (
                <>
                  <Pencil size={20} className="text-primary" />
                  Edit Blog Post
                </>
              ) : (
                <>
                  <Plus size={20} className="text-primary" />
                  Create New Blog Post
                </>
              )}
            </h2>
            {editingBlog && (
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Editing: {editingBlog.title.substring(0, 30)}
                {editingBlog.title.length > 30 ? "..." : ""}
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Blog post title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cover Image URL <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
              {formData.coverImage && (
                <img
                  src={formData.coverImage}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg mt-2 border border-border"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. tips, buying guide, review"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Excerpt <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="A short summary of the blog post..."
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Content <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={10}
                placeholder="Write your blog content here... Use markdown-style paragraphs."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="px-5 py-2.5 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBlog}
                disabled={actionLoading === (editingBlog?._id || "new")}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {actionLoading === (editingBlog?._id || "new") ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {editingBlog ? "Save Changes" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Posts Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {blogs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              No blog posts yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Post</th>
                  <th className="px-6 py-4 font-medium">Author</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Views</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blogs.map((blog) => (
                  <tr
                    key={blog._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={blog.coverImage}
                          alt=""
                          className="w-16 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">
                            {blog.title}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {blog.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {blog.author}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          blog.published
                            ? "bg-green-500/10 text-green-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {blog.views}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditForm(blog)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Post"
                        >
                          <Pencil size={18} />
                        </button>
                        {/* View on site */}
                        <a
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View on Site"
                        >
                          <ExternalLink size={18} />
                        </a>
                        {/* Toggle Publish */}
                        <button
                          disabled={actionLoading === blog._id}
                          onClick={() => togglePublish(blog._id, blog.published)}
                          className={`p-2 rounded-lg transition-colors ${
                            blog.published
                              ? "text-amber-500 hover:bg-amber-500/10"
                              : "text-green-500 hover:bg-green-500/10"
                          }`}
                          title={
                            blog.published ? "Unpublish" : "Publish"
                          }
                        >
                          {blog.published ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          disabled={actionLoading === blog._id}
                          onClick={() => deleteBlog(blog._id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Post"
                        >
                          {actionLoading === blog._id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
