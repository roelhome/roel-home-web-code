import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { type Blog } from '../../data/blogs';
import { ImageDropzone } from './ImageDropzone';
import { renderMarkdown } from '../../lib/markdown';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  BookOpen,
  Eye,
  X,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Tag,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';

const CATEGORY_PRESETS = [
  'Doors & Entrances',
  'Wall Solutions',
  'Surfaces & Materials',
  'Architectural Design',
  'Materials & Care',
  'Project Spotlights'
];

export const BlogsManager: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'published' | 'draft'>('ALL');
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'media' | 'preview'>('content');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [inArticleImages, setInArticleImages] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [seoKeywordsRaw, setSeoKeywordsRaw] = useState('');
  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);

  // Fetch blogs from Supabase
  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('blogs')
        .select('*')
        .order('published_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setBlogs(
        (data || []).map((b: any) => ({
          id: b.id,
          slug: b.slug || b.id,
          title: b.title,
          excerpt: b.excerpt || '',
          content: b.content || '',
          cover_image: b.cover_image || '/images/hero-doors.jpg',
          category: b.category || 'General',
          author: b.author || 'ROEL Studio Editorial',
          author_role: b.author_role || 'Architectural Materials Specialist',
          read_time: b.read_time || '5 min read',
          tags: Array.isArray(b.tags) ? b.tags : [],
          is_featured: !!b.is_featured,
          status: b.status || 'published',
          seo_title: b.seo_title || b.title,
          seo_description: b.seo_description || b.excerpt || '',
          seo_keywords: Array.isArray(b.seo_keywords) ? b.seo_keywords : [],
          published_at: b.published_at || b.created_at || new Date().toISOString(),
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString()
        }))
      );
    } catch (err: any) {
      console.error('Fetch blogs error:', err);
      setError(err?.message || 'Failed to load blogs from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === 'ALL' || b.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'ALL' || b.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [blogs, search, categoryFilter, statusFilter]);

  // Unique categories from blogs
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [blogs]);

  // All available categories (presets + existing from DB)
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(CATEGORY_PRESETS);
    blogs.forEach((b) => {
      if (b.category?.trim()) set.add(b.category.trim());
    });
    return Array.from(set);
  }, [blogs]);

  // Helper to slugify title
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Open Create Modal
  const handleCreateNew = () => {
    const newId = `article-${Date.now().toString(36)}`;
    setEditingBlog({
      id: newId,
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      cover_image: '',
      category: 'Doors & Entrances',
      author: 'ROEL Studio Editorial',
      author_role: 'Architectural Materials Specialist',
      read_time: '5 min read',
      tags: ['Architectural Living'],
      is_featured: false,
      status: 'published',
      seo_title: '',
      seo_description: '',
      seo_keywords: ['Kochi architecture', 'ROEL Home Solutions'],
      published_at: new Date().toISOString()
    });
    setInArticleImages([]);
    setSeoKeywordsRaw('Kochi architecture, ROEL Home Solutions');
    setIsCustomCategory(false);
    setIsNew(true);
    setActiveTab('content');
    setError(null);
  };

  // Open Edit Modal
  const handleEdit = (blog: Blog) => {
    setEditingBlog({
      ...blog,
      tags: Array.isArray(blog.tags) ? [...blog.tags] : [],
      seo_keywords: Array.isArray(blog.seo_keywords) ? [...blog.seo_keywords] : []
    });
    setSeoKeywordsRaw(Array.isArray(blog.seo_keywords) ? blog.seo_keywords.join(', ') : '');
    setInArticleImages([]);
    setIsCustomCategory(false);
    setIsNew(false);
    setActiveTab('content');
    setError(null);
  };

  // Duplicate an article
  const handleDuplicate = async (blog: Blog) => {
    const newSlug = `${blog.slug}-copy-${Date.now().toString(36).substring(3, 7)}`;
    const newBlog: Partial<Blog> = {
      ...blog,
      id: newSlug,
      slug: newSlug,
      title: `${blog.title} (Copy)`,
      status: 'draft',
      is_featured: false,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSaving(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from('blogs').insert([newBlog]);
      if (insErr) throw insErr;

      setSuccessMessage(`Duplicated "${blog.title}" as draft!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await fetchBlogs();
    } catch (err: any) {
      console.error('Duplicate error:', err);
      setError(err?.message || 'Failed to duplicate article');
    } finally {
      setSaving(false);
    }
  };

  // Save Blog (Insert or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    if (!editingBlog.title?.trim()) {
      setError('Article title is required.');
      return;
    }

    const finalSlug = (editingBlog.slug?.trim() || slugify(editingBlog.title)).trim();
    if (!finalSlug) {
      setError('A valid URL slug is required.');
      return;
    }

    if (!editingBlog.cover_image?.trim()) {
      setError('A cover image is required for SEO and visual display.');
      return;
    }

    setSaving(true);
    setError(null);

    const parsedKeywords = seoKeywordsRaw
      ? seoKeywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
      : (Array.isArray(editingBlog.seo_keywords) ? editingBlog.seo_keywords : []);

    const payload = {
      id: finalSlug,
      slug: finalSlug,
      title: editingBlog.title.trim(),
      excerpt: editingBlog.excerpt?.trim() || '',
      content: editingBlog.content?.trim() || '',
      cover_image: editingBlog.cover_image.trim(),
      category: editingBlog.category || 'General',
      author: editingBlog.author?.trim() || 'ROEL Studio Editorial',
      author_role: editingBlog.author_role?.trim() || 'Architectural Materials Specialist',
      read_time: editingBlog.read_time?.trim() || '5 min read',
      tags: Array.isArray(editingBlog.tags) ? editingBlog.tags : [],
      is_featured: !!editingBlog.is_featured,
      status: editingBlog.status || 'published',
      seo_title: editingBlog.seo_title?.trim() || editingBlog.title.trim(),
      seo_description: editingBlog.seo_description?.trim() || editingBlog.excerpt?.trim() || '',
      seo_keywords: parsedKeywords,
      published_at: editingBlog.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (isNew) {
        const { error: insErr } = await supabase.from('blogs').insert([
          {
            ...payload,
            created_at: new Date().toISOString()
          }
        ]);
        if (insErr) throw insErr;
        setSuccessMessage(`Article "${payload.title}" created successfully!`);
      } else {
        const { error: upErr } = await supabase
          .from('blogs')
          .update(payload)
          .eq('id', editingBlog.id);
        if (upErr) throw upErr;
        setSuccessMessage(`Article "${payload.title}" updated successfully!`);
      }

      setTimeout(() => setSuccessMessage(null), 3500);
      setEditingBlog(null);
      setSeoKeywordsRaw('');
      await fetchBlogs();
    } catch (err: any) {
      console.error('Save blog error:', err);
      setError(err?.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  // Delete Blog
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const { error: delErr } = await supabase.from('blogs').delete().eq('id', id);
      if (delErr) throw delErr;

      setSuccessMessage(`Deleted "${title}" successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await fetchBlogs();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err?.message || 'Failed to delete blog post');
    } finally {
      setSaving(false);
    }
  };

  // Insert markdown snippet into content
  const insertMarkdown = (snippet: string) => {
    setEditingBlog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        content: (prev.content || '') + '\n' + snippet + '\n'
      };
    });
  };

  // Directly upload and embed an image into article body
  const handleBodyImageUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploadingBodyImage(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blogs');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to upload image');
        }
        uploadedUrls.push(data.url);
      }

      if (uploadedUrls.length > 0) {
        let snippet = '';
        uploadedUrls.forEach((url) => {
          const caption = editingBlog?.title || 'ROEL Architectural Detail';
          snippet += `\n\n![${caption}](${url})\n\n`;
        });
        insertMarkdown(snippet);
        setSuccessMessage(`Added ${uploadedUrls.length} image(s) directly to your article!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Body image upload error:', err);
      setError(`Failed to upload image: ${err?.message || 'Upload error'}`);
    } finally {
      setUploadingBodyImage(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(slug);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#FFFFFF',
          padding: '24px 28px',
          border: '1px solid rgba(118, 89, 65, 0.18)',
          borderRadius: '4px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ width: '22px', height: '22px', color: '#D49E58' }} />
            <h2 style={{ margin: 0, fontFamily: 'RoelSerif, Georgia, serif', fontSize: '24px', color: '#19120C' }}>
              Blog Posts & Architectural Journal
            </h2>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#806957' }}>
            Manage SEO-optimized articles, guides, and material insights with drag-and-drop Cloudflare R2 uploads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchBlogs}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118,89,65,0.22)',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#5b4130',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', color: '#D49E58' }} />
            Create Article
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '12px 18px',
            borderRadius: '4px',
            fontSize: '13px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: List View OR Editor View */}
      {!editingBlog ? (
        <>
          {/* Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div style={{ backgroundColor: '#fff', padding: '16px 20px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#806957', fontWeight: 700, letterSpacing: '0.08em' }}>
                Total Articles
              </span>
              <div style={{ fontSize: '28px', fontFamily: 'RoelSerif, Georgia, serif', fontWeight: 600, color: '#19120C', marginTop: '4px' }}>
                {blogs.length}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px 20px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 700, letterSpacing: '0.08em' }}>
                Published Live
              </span>
              <div style={{ fontSize: '28px', fontFamily: 'RoelSerif, Georgia, serif', fontWeight: 600, color: '#166534', marginTop: '4px' }}>
                {blogs.filter((b) => b.status === 'published').length}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px 20px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#854d0e', fontWeight: 700, letterSpacing: '0.08em' }}>
                Drafts
              </span>
              <div style={{ fontSize: '28px', fontFamily: 'RoelSerif, Georgia, serif', fontWeight: 600, color: '#854d0e', marginTop: '4px' }}>
                {blogs.filter((b) => b.status === 'draft').length}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '16px 20px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#D49E58', fontWeight: 700, letterSpacing: '0.08em' }}>
                Featured Stories
              </span>
              <div style={{ fontSize: '28px', fontFamily: 'RoelSerif, Georgia, serif', fontWeight: 600, color: '#D49E58', marginTop: '4px' }}>
                {blogs.filter((b) => b.is_featured).length}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div
            className="roel-filter-bar"
            style={{
              backgroundColor: '#FFFFFF',
              padding: '18px 24px',
              border: '1px solid rgba(118,89,65,0.18)',
              borderRadius: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#806957'
                }}
              />
              <input
                type="text"
                placeholder="Search articles by title, keywords or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  fontSize: '13px',
                  border: '1px solid rgba(118,89,65,0.25)',
                  borderRadius: '4px',
                  backgroundColor: '#FAF7F2',
                  color: '#19120C',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filter controls */}
            <div className="roel-filter-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '9px 12px',
                  fontSize: '12px',
                  border: '1px solid rgba(118,89,65,0.25)',
                  borderRadius: '4px',
                  backgroundColor: '#FAF7F2',
                  color: '#19120C',
                  fontWeight: 600
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '9px 12px',
                  fontSize: '12px',
                  border: '1px solid rgba(118,89,65,0.25)',
                  borderRadius: '4px',
                  backgroundColor: '#FAF7F2',
                  color: '#19120C',
                  fontWeight: 600
                }}
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Blog Table / Grid */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(118,89,65,0.18)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#806957' }}>
                <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#D49E58' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Loading articles from Supabase...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <FileText style={{ width: '40px', height: '40px', color: 'rgba(118,89,65,0.35)', margin: '0 auto 14px' }} />
                <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 8px' }}>
                  No articles found
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957' }}>
                  Try adjusting your search criteria or create a new blog post.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#19120C',
                    color: '#F0E2CE',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredBlogs.map((b, idx) => (
                  <div
                    key={b.id}
                    className="roel-blog-card-item"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr auto',
                      gap: '20px',
                      padding: '20px 24px',
                      alignItems: 'center',
                      borderBottom: idx < filteredBlogs.length - 1 ? '1px solid rgba(118,89,65,0.12)' : 'none',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="roel-blog-card-thumbnail"
                      style={{
                        width: '120px',
                        height: '80px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#19120C'
                      }}
                    >
                      <img
                        src={b.cover_image}
                        alt={b.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/hero-doors.jpg';
                        }}
                      />
                      {b.is_featured && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            backgroundColor: '#D49E58',
                            color: '#19120C',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '2px',
                            textTransform: 'uppercase'
                          }}
                        >
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontWeight: 700,
                            color: '#765941',
                            backgroundColor: 'rgba(118,89,65,0.1)',
                            padding: '2px 8px',
                            borderRadius: '2px'
                          }}
                        >
                          {b.category}
                        </span>

                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '2px',
                            backgroundColor: b.status === 'published' ? '#dcfce7' : '#fef9c3',
                            color: b.status === 'published' ? '#166534' : '#854d0e',
                            textTransform: 'uppercase'
                          }}
                        >
                          {b.status}
                        </span>

                        <span style={{ fontSize: '11px', color: '#806957', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          {b.read_time}
                        </span>

                        <span style={{ fontSize: '11px', color: '#806957', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '12px', height: '12px' }} />
                          {new Date(b.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: '0 0 6px',
                          fontFamily: 'RoelSerif, Georgia, serif',
                          fontSize: '17px',
                          color: '#19120C',
                          fontWeight: 600,
                          lineHeight: 1.3
                        }}
                      >
                        {b.title}
                      </h4>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: '#806957',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {b.excerpt}
                      </p>

                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#765941' }}>
                        <code>/blog/{b.slug}</code>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="roel-blog-card-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <a
                        href={`/blog/${b.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View live post on site"
                        style={{
                          padding: '7px 9px',
                          backgroundColor: '#FAF7F2',
                          border: '1px solid rgba(118,89,65,0.22)',
                          borderRadius: '4px',
                          color: '#765941',
                          display: 'flex',
                          alignItems: 'center',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(b.slug)}
                        title="Copy article URL"
                        style={{
                          padding: '7px 9px',
                          backgroundColor: '#FAF7F2',
                          border: '1px solid rgba(118,89,65,0.22)',
                          borderRadius: '4px',
                          color: copiedUrl === b.slug ? '#166534' : '#765941',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {copiedUrl === b.slug ? <Check style={{ width: '14px', height: '14px' }} /> : <Share2 style={{ width: '14px', height: '14px' }} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(b)}
                        title="Duplicate as draft"
                        style={{
                          padding: '7px 9px',
                          backgroundColor: '#FAF7F2',
                          border: '1px solid rgba(118,89,65,0.22)',
                          borderRadius: '4px',
                          color: '#765941',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Copy style={{ width: '14px', height: '14px' }} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(b)}
                        title="Edit article"
                        style={{
                          padding: '7px 14px',
                          backgroundColor: '#19120C',
                          color: '#F0E2CE',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Edit3 style={{ width: '13px', height: '13px', color: '#D49E58' }} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(b.id, b.title)}
                        title="Delete article"
                        style={{
                          padding: '7px 9px',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Edit / Create Form View */
        <form
          onSubmit={handleSave}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(118,89,65,0.18)',
            borderRadius: '4px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* Top Form Navigation */}
          <div
            className="roel-form-topbar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(118,89,65,0.15)',
              paddingBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingBlog(null);
                  setSeoKeywordsRaw('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#765941',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Back to Articles
              </button>
              <span style={{ color: 'rgba(118,89,65,0.3)' }}>|</span>
              <h3 style={{ margin: 0, fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', color: '#19120C' }}>
                {isNew ? 'Create New Blog Post' : `Edit: ${editingBlog.title || 'Untitled Article'}`}
              </h3>
            </div>

            <div className="roel-form-topbar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingBlog(null);
                  setSeoKeywordsRaw('');
                }}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#FAF7F2',
                  border: '1px solid rgba(118,89,65,0.22)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#5b4130',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  backgroundColor: '#19120C',
                  color: '#F0E2CE',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check style={{ width: '14px', height: '14px', color: '#D49E58' }} />
                    Save & Publish
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-tabs: Content, SEO, Media & Assets, Preview */}
          <div className="roel-tabs-scroll">
            {[
              { key: 'content', label: '1. Content & Writing' },
              { key: 'seo', label: '2. SEO & Meta Tags' },
              { key: 'media', label: '3. In-Article Media' },
              { key: 'preview', label: '4. Live Markdown Preview' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? '#19120C' : '#FAF7F2',
                  color: activeTab === tab.key ? '#F0E2CE' : '#765941',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CONTENT */}
          {activeTab === 'content' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Title & Slug */}
              <div className="roel-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBlog.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingBlog((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: isNew && (!prev?.slug || prev.slug === slugify(prev.title || '')) ? slugify(newTitle) : prev?.slug,
                        seo_title: !prev?.seo_title || prev.seo_title === prev.title ? newTitle : prev.seo_title
                      }));
                    }}
                    placeholder="e.g. The Ultimate Guide to Choosing WPC vs Wooden Doors for Kerala's Humid Climate"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      fontFamily: 'RoelSerif, Georgia, serif',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    URL Slug * (SEO Path)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '9px 10px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.25)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '11px', color: '#806957' }}>
                      /blog/
                    </span>
                    <input
                      type="text"
                      required
                      value={editingBlog.slug || ''}
                      onChange={(e) => setEditingBlog((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                      placeholder="wpc-vs-wooden-doors-kerala-climate"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        fontSize: '13px',
                        border: '1px solid rgba(118,89,65,0.25)',
                        borderRadius: '0 4px 4px 0',
                        backgroundColor: '#FAF7F2'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Category, Read Time, Status, Featured */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130' }}>
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setEditingBlog((prev) => ({ ...prev, category: '' }));
                        } else {
                          setEditingBlog((prev) => ({ ...prev, category: allAvailableCategories[0] || 'Doors & Entrances' }));
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#765941',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {isCustomCategory ? '← Choose existing' : '+ Add new'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editingBlog.category ?? ''}
                      onChange={(e) => setEditingBlog((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="Type custom category name..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '13px',
                        border: '1px solid #765941',
                        borderRadius: '4px',
                        backgroundColor: '#FAF7F2',
                        color: '#19120C'
                      }}
                    />
                  ) : (
                    <select
                      value={editingBlog.category || allAvailableCategories[0]}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomCategory(true);
                          setEditingBlog((prev) => ({ ...prev, category: '' }));
                        } else {
                          setEditingBlog((prev) => ({ ...prev, category: e.target.value }));
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '13px',
                        border: '1px solid rgba(118,89,65,0.25)',
                        borderRadius: '4px',
                        backgroundColor: '#FAF7F2',
                        color: '#19120C',
                        fontWeight: 500
                      }}
                    >
                      {allAvailableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__NEW__">+ Add New Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={editingBlog.read_time ?? ''}
                    onChange={(e) => setEditingBlog((prev) => ({ ...prev, read_time: e.target.value }))}
                    placeholder="e.g. 5 min read"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Publish Status
                  </label>
                  <select
                    value={editingBlog.status || 'published'}
                    onChange={(e) => setEditingBlog((prev) => ({ ...prev, status: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#FAF7F2',
                      fontWeight: 600
                    }}
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Spotlight / Featured
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 12px',
                      backgroundColor: '#FAF7F2',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!editingBlog.is_featured}
                      onChange={(e) => setEditingBlog((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    />
                    Feature on Blog Hero
                  </label>
                </div>
              </div>

              {/* Row 3: Author & Author Role */}
              <div className="roel-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={editingBlog.author ?? ''}
                    onChange={(e) => setEditingBlog((prev) => ({ ...prev, author: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Author Title / Role
                  </label>
                  <input
                    type="text"
                    value={editingBlog.author_role ?? ''}
                    onChange={(e) => setEditingBlog((prev) => ({ ...prev, author_role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '4px',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Drag-and-Drop Cover Image */}
              <div style={{ backgroundColor: '#FAF7F2', padding: '18px', border: '1px solid rgba(118,89,65,0.2)', borderRadius: '4px' }}>
                <ImageDropzone
                  value={editingBlog.cover_image || ''}
                  onChange={(url) => setEditingBlog((prev) => ({ ...prev, cover_image: url }))}
                  folder="blogs"
                  label="Featured Cover Image (Drag & Drop to Cloudflare R2) *"
                  hint="Drag and drop a high resolution cover photo (JPG, PNG, WebP) up to 30MB"
                />
              </div>

              {/* Row 5: Excerpt */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Excerpt / Summary (Used in cards & SEO snippet)
                </label>
                <textarea
                  rows={3}
                  value={editingBlog.excerpt || ''}
                  onChange={(e) => {
                    const newExcerpt = e.target.value;
                    setEditingBlog((prev) => ({
                      ...prev,
                      excerpt: newExcerpt,
                      seo_description: !prev?.seo_description || prev.seo_description === prev.excerpt ? newExcerpt : prev.seo_description
                    }));
                  }}
                  placeholder="Provide an engaging 2-3 sentence summary explaining the core takeaway of this article..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2'
                  }}
                />
              </div>

              {/* Row 6: Article Content with Markdown Helpers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130' }}>
                    Article Body Content (Markdown Supported) *
                  </label>

                  {/* Formatting quick buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Hidden file input for direct image upload into article */}
                    <input
                      ref={bodyImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleBodyImageUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />

                    {/* Direct Add Image Button */}
                    <button
                      type="button"
                      onClick={() => bodyImageInputRef.current?.click()}
                      disabled={uploadingBodyImage}
                      title="Upload and insert a photo directly from your computer into this article"
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#19120C',
                        color: '#F0E2CE',
                        border: '1px solid rgba(229,191,140,0.5)',
                        borderRadius: '2px',
                        cursor: uploadingBodyImage ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {uploadingBodyImage ? (
                        <>
                          <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon style={{ width: '12px', height: '12px', color: '#D49E58' }} />
                          + Add Image
                        </>
                      )}
                    </button>

                    <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(118,89,65,0.25)', margin: '0 2px' }} />

                    <button
                      type="button"
                      onClick={() => insertMarkdown('## Section Heading')}
                      style={{ padding: '3px 7px', fontSize: '11px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.3)', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      + H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('### Sub-heading')}
                      style={{ padding: '3px 7px', fontSize: '11px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.3)', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      + H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- Bullet point item 1\n- Bullet point item 2\n- Bullet point item 3')}
                      style={{ padding: '3px 7px', fontSize: '11px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.3)', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      + List
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> **Architect Insight**: Add an impactful quotation or recommendation here.')}
                      style={{ padding: '3px 7px', fontSize: '11px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.3)', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      + Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n| Feature | Option A | Option B |\n| :--- | :--- | :--- |\n| Moisture Resistance | High | Moderate |\n| Termite Resistance | 100% | Requires Treatment |\n')}
                      style={{ padding: '3px 7px', fontSize: '11px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.3)', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      + Table
                    </button>
                  </div>
                </div>

                <textarea
                  rows={18}
                  required
                  value={editingBlog.content || ''}
                  onChange={(e) => setEditingBlog((prev) => ({ ...prev, content: e.target.value }))}
                  onDrop={(e) => {
                    if (e.dataTransfer?.files?.length) {
                      e.preventDefault();
                      handleBodyImageUpload(e.dataTransfer.files);
                    }
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (items) {
                      const imageFiles: File[] = [];
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.startsWith('image/')) {
                          const file = items[i].getAsFile();
                          if (file) imageFiles.push(file);
                        }
                      }
                      if (imageFiles.length > 0) {
                        e.preventDefault();
                        handleBodyImageUpload(imageFiles);
                      }
                    }
                  }}
                  placeholder="Write or paste your article in markdown. Use ## for section headings, - for lists, or click '+ Add Image' above to embed photos..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    lineHeight: 1.7,
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2'
                  }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#806957' }}>
                  💡 Click <strong>+ Add Image</strong> above to pick a photo from your computer, or simply drag & drop image files directly into this box.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SEO & META TAGS */}
          {activeTab === 'seo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#FAF7F2', padding: '16px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#19120C' }}>
                  Google SERP Snippet Preview
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#806957' }}>
                  This simulates how this blog article will appear in search results on Google.
                </p>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    maxWidth: '650px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#202124', marginBottom: '2px' }}>
                    https://roelhomes.com › blog › {editingBlog.slug || 'article-slug'}
                  </div>
                  <div style={{ fontSize: '18px', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, marginBottom: '4px', cursor: 'pointer' }}>
                    {editingBlog.seo_title || editingBlog.title || 'Article Title - ROEL Home Solutions'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: 1.5 }}>
                    {editingBlog.seo_description || editingBlog.excerpt || 'Article summary description snippet will appear here...'}
                  </div>
                </div>
              </div>

              {/* SEO Title Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130' }}>
                    SEO Meta Title (Target: 50–60 characters)
                  </label>
                  <span style={{ fontSize: '11px', color: (editingBlog.seo_title?.length || 0) > 60 ? '#b91c1c' : '#166534', fontWeight: 600 }}>
                    {editingBlog.seo_title?.length || 0} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={editingBlog.seo_title || ''}
                  onChange={(e) => setEditingBlog((prev) => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="e.g. WPC vs Wooden Doors for Kerala Climate: Durability & Design Guide | ROEL"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2'
                  }}
                />
              </div>

              {/* SEO Description Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130' }}>
                    SEO Meta Description (Target: 140–160 characters)
                  </label>
                  <span style={{ fontSize: '11px', color: (editingBlog.seo_description?.length || 0) > 160 ? '#b91c1c' : '#166534', fontWeight: 600 }}>
                    {editingBlog.seo_description?.length || 0} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={editingBlog.seo_description || ''}
                  onChange={(e) => setEditingBlog((prev) => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="e.g. In-depth comparison of WPC vs solid wood doors for homes in Kochi & Kerala. Learn about moisture resistance, zero swelling, termite proofing, and luxury finishes."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2'
                  }}
                />
              </div>

              {/* Focus Keywords */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Target SEO Keywords (Comma separated)
                </label>
                <input
                  type="text"
                  value={seoKeywordsRaw}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setSeoKeywordsRaw(raw);
                    const parsed = raw.split(',').map((k) => k.trim()).filter(Boolean);
                    setEditingBlog((prev) => ({ ...prev, seo_keywords: parsed }));
                  }}
                  onBlur={() => {
                    if (Array.isArray(editingBlog.seo_keywords)) {
                      setSeoKeywordsRaw(editingBlog.seo_keywords.join(', '));
                    }
                  }}
                  placeholder="e.g. WPC doors Kochi, waterproof doors Kerala, wooden vs WPC doors, interior doors Kerala"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '4px',
                    backgroundColor: '#FAF7F2'
                  }}
                />
                {Array.isArray(editingBlog.seo_keywords) && editingBlog.seo_keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {editingBlog.seo_keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          backgroundColor: '#EBE2D5',
                          borderRadius: '3px',
                          fontSize: '11px',
                          color: '#332418',
                          fontWeight: 500
                        }}
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingBlog.seo_keywords!.filter((_, i) => i !== idx);
                            setEditingBlog((prev) => ({ ...prev, seo_keywords: updated }));
                            setSeoKeywordsRaw(updated.join(', '));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '13px',
                            lineHeight: 1,
                            color: '#806957',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remove keyword"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: IN-ARTICLE MEDIA ASSETS */}
          {activeTab === 'media' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#FAF7F2', padding: '16px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#19120C' }}>
                  Drag & Drop In-Article Photos
                </h4>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#806957' }}>
                  Drop photos below to upload them to Cloudflare R2 bucket. Click any uploaded image to copy its markdown tag <code>![Caption](url)</code> directly into your article content.
                </p>

                <ImageDropzone
                  multiple
                  folder="blogs"
                  onChange={(urls) => {
                    if (Array.isArray(urls)) {
                      setInArticleImages(urls);
                    }
                  }}
                  label="Upload Additional In-Article Illustrations / Photos"
                  hint="Drag & drop images here. They will be stored in Cloudflare R2 bucket roel-homes-media/blogs"
                />
              </div>

              {inArticleImages.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', color: '#5b4130' }}>
                    Click an image to insert into article body:
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {inArticleImages.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          insertMarkdown(`![ROEL Architectural Detail](${url})`);
                          setSuccessMessage('Inserted image into article content!');
                          setTimeout(() => setSuccessMessage(null), 2000);
                        }}
                        style={{
                          border: '1px solid rgba(118,89,65,0.25)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: '#19120C',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={url} alt={`Uploaded ${i + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px 8px', fontSize: '10px', color: '#F0E2CE', textAlign: 'center', backgroundColor: '#19120C' }}>
                          + Insert into content
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div
              style={{
                backgroundColor: '#FAF7F2',
                padding: '28px',
                border: '1px solid rgba(118,89,65,0.2)',
                borderRadius: '4px',
                minHeight: '400px'
              }}
            >
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <span
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    color: '#765941'
                  }}
                >
                  {editingBlog.category} • {editingBlog.read_time}
                </span>

                <h1 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '32px', margin: '14px 0 18px', color: '#19120C' }}>
                  {editingBlog.title || 'Untitled Article'}
                </h1>

                {editingBlog.cover_image && (
                  <div style={{ width: '100%', height: '360px', overflow: 'hidden', borderRadius: '4px', marginBottom: '24px', backgroundColor: '#19120C' }}>
                    <img src={editingBlog.cover_image} alt={editingBlog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {editingBlog.content ? (
                  <>
                    <style>{`
                      .admin-preview-content .table-wrapper { overflow-x: auto; margin: 28px 0; border: 1px solid rgba(118, 89, 65, 0.25); border-radius: 4px; background: #FAF7F2; }
                      .admin-preview-content table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
                      .admin-preview-content th { background: #19120C; color: #E8D3B9; font-weight: 500; font-size: 13px; padding: 12px 18px; letter-spacing: 0.03em; }
                      .admin-preview-content td { padding: 12px 18px; border-bottom: 1px solid rgba(118, 89, 65, 0.16); color: #332418; line-height: 1.6; }
                      .admin-preview-content tr:last-child td { border-bottom: none; }
                      .admin-preview-content .article-quote { border-left: 3px solid #C4A482; padding: 12px 18px; margin: 20px 0; background: #FAF7F2; font-style: italic; color: #5b4130; }
                      .admin-preview-content .article-divider { height: 1px; background: rgba(118, 89, 65, 0.2); border: none; margin: 32px 0; }
                      .admin-preview-content .article-figure { margin: 24px 0; }
                      .admin-preview-content .article-figure img { width: 100%; border-radius: 4px; }
                      .admin-preview-content .article-figure figcaption { font-size: 11px; color: #806957; margin-top: 6px; text-align: center; }
                      .admin-preview-content h2 { font-family: RoelSerif, Georgia, serif; font-size: 24px; color: #19120C; margin: 32px 0 16px; }
                      .admin-preview-content h3 { font-family: RoelSerif, Georgia, serif; font-size: 19px; color: #19120C; margin: 24px 0 12px; }
                      .admin-preview-content p { margin: 0 0 18px; line-height: 1.8; color: #332418; }
                      .admin-preview-content ul { padding-left: 20px; margin-bottom: 18px; }
                      .admin-preview-content li { margin-bottom: 8px; line-height: 1.6; }
                    `}</style>
                    <div
                      className="admin-preview-content"
                      style={{ fontSize: '14px', lineHeight: 1.8, color: '#332418' }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(editingBlog.content) }}
                    />
                  </>
                ) : (
                  <div style={{ fontSize: '14px', color: '#806957', fontStyle: 'italic', padding: '24px 0' }}>
                    No content written yet. Switch to the Content tab to write.
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
