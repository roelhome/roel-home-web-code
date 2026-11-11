import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageDropzone } from './ImageDropzone';
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
  Building2,
  MapPin,
  Eye,
  X
} from 'lucide-react';

export interface AdminProject {
  id: string;
  name: string;
  location: string;
  category: string;
  year: string;
  image_url: string;
  summary: string;
  story: string;
  is_demo: boolean;
  order_index: number;
  created_at?: string;
}

const CATEGORY_PRESETS = [
  'Residential',
  'Commercial',
  'Hospitality',
  'Villa',
  'Interior Architecture',
  'Facade & Entrance'
];

export const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all projects from Supabase
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('projects')
        .select('*')
        .order('order_index', { ascending: true });

      if (fetchErr) throw fetchErr;

      setProjects(data || []);
    } catch (err: any) {
      console.error('Fetch projects error:', err);
      setError(err?.message || 'Failed to load projects from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects by search and category
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.summary.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'ALL' || p.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [projects, search, categoryFilter]);

  // Unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  // Slugify helper for generating URL friendly project IDs
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Open modal for creating a new project
  const handleCreateNew = () => {
    const currentYear = new Date().getFullYear().toString();
    const nextOrder = projects.length > 0 ? Math.max(...projects.map((p) => p.order_index || 0)) + 1 : 1;

    setEditingProject({
      id: '',
      name: '',
      location: 'Kochi, Kerala',
      category: 'Residential',
      year: currentYear,
      image_url: '/images/living.webp',
      summary: '',
      story: '',
      is_demo: false,
      order_index: nextOrder
    });
    setIsNew(true);
    setError(null);
  };

  // Open modal for editing existing project
  const handleEdit = (proj: AdminProject) => {
    setEditingProject({ ...proj });
    setIsNew(false);
    setError(null);
  };

  // Duplicate an existing project
  const handleDuplicate = async (proj: AdminProject) => {
    const newId = `${proj.id}-copy-${Date.now().toString(36).substring(4, 7)}`;
    const newProj: AdminProject = {
      ...proj,
      id: newId,
      name: `${proj.name} (Copy)`,
      order_index: (proj.order_index || 0) + 1
    };

    setSaving(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from('projects').insert([newProj]);
      if (insErr) throw insErr;

      setSuccessMessage(`Duplicated "${proj.name}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchProjects();
    } catch (err: any) {
      console.error('Duplicate error:', err);
      setError(err?.message || 'Failed to duplicate project');
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" (${id})? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('projects').delete().eq('id', id);
      if (delErr) throw delErr;

      setSuccessMessage(`Deleted "${name}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchProjects();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err?.message || 'Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  // Save project (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Validation
    const cleanName = editingProject.name.trim();
    if (!cleanName) {
      setError('Project Name is required.');
      return;
    }

    let cleanId = editingProject.id.trim();
    if (!cleanId) {
      cleanId = slugify(cleanName);
    }

    if (!cleanId) {
      setError('Valid Project ID / Slug is required.');
      return;
    }

    if (!editingProject.image_url) {
      setError('Please provide a Cover Image.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      id: cleanId,
      name: cleanName,
      location: editingProject.location.trim() || 'Kochi, Kerala',
      category: editingProject.category.trim() || 'Residential',
      year: editingProject.year.trim() || new Date().getFullYear().toString(),
      image_url: editingProject.image_url.trim(),
      summary: editingProject.summary.trim(),
      story: editingProject.story.trim(),
      is_demo: !!editingProject.is_demo,
      order_index: Number(editingProject.order_index) || 1
    };

    try {
      if (isNew) {
        // Check if ID already exists
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('id', cleanId)
          .maybeSingle();

        if (existing) {
          throw new Error(`A project with slug "${cleanId}" already exists. Please choose a unique slug.`);
        }

        const { error: insertErr } = await supabase.from('projects').insert([payload]);
        if (insertErr) throw insertErr;
      } else {
        const { error: updateErr } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id);

        if (updateErr) throw updateErr;
      }

      setSuccessMessage(`Saved project "${cleanName}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingProject(null);
      await fetchProjects();
    } catch (err: any) {
      console.error('Save project error:', err);
      setError(err?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontFamily: 'RoelSerif, Georgia, serif',
                fontSize: '32px',
                fontWeight: 400,
                margin: 0,
                color: '#19120C'
              }}
            >
              Projects & Spaces
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(118,89,65,0.12)',
                color: '#765941',
                padding: '4px 10px',
                borderRadius: '12px'
              }}
            >
              {projects.length} Case Studies
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#765941' }}>
            Manage architectural portfolio entries, residential villas, and commercial spaces displayed on{' '}
            <a href="/projects" target="_blank" style={{ color: '#19120C', fontWeight: 600 }}>
              roelhomes.com/projects ↗
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchProjects}
            title="Refresh projects list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#fff',
              border: '1px solid rgba(118,89,65,0.25)',
              borderRadius: '2px',
              color: '#765941',
              fontSize: '12px',
              fontWeight: 600,
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
              padding: '11px 22px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: '1px solid #19120C',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(25,18,12,0.15)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', color: '#E5BF8C' }} />
            + New Project
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '2px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '2px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <Check style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '14px 18px',
          borderRadius: '2px',
          border: '1px solid rgba(118,89,65,0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#a0856d'
            }}
          />
          <input
            type="text"
            placeholder="Search projects by name, location, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118,89,65,0.25)',
              borderRadius: '2px',
              fontSize: '12.5px',
              color: '#19120C',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941' }}>
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118,89,65,0.25)',
              borderRadius: '2px',
              fontSize: '12px',
              color: '#19120C',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories ({projects.length})</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#765941' }}>
          <Loader2 style={{ width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#D49E58' }} />
          <p style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Loading Architectural Projects...
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1.5px dashed rgba(118,89,65,0.3)',
            borderRadius: '2px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#765941'
          }}
        >
          <Building2 style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 8px', color: '#19120C' }}>No projects found</h3>
          <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
            {search || categoryFilter !== 'ALL'
              ? 'No projects match your current search and filter criteria.'
              : 'You have not added any architectural projects yet.'}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Create First Project
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProjects.map((p) => {
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(118,89,65,0.22)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(25,18,12,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Project Showcase Image */}
                <div style={{ position: 'relative', height: '220px', backgroundColor: '#9a7153', overflow: 'hidden' }}>
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/living.webp';
                    }}
                  />
                  {/* Status Badges */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(25,18,12,0.88)',
                        color: '#E5BF8C',
                        padding: '4px 8px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        borderRadius: '2px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {p.category}
                    </span>
                  </div>

                  {/* Year Tag */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      backgroundColor: 'rgba(25,18,12,0.75)',
                      color: '#FAF7F2',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '2px'
                    }}
                  >
                    {p.year}
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h3
                      style={{
                        fontFamily: 'RoelSerif, Georgia, serif',
                        fontSize: '20px',
                        fontWeight: 400,
                        margin: 0,
                        color: '#19120C'
                      }}
                    >
                      {p.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#765941', fontFamily: 'monospace' }}>
                      #{p.order_index}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      color: '#765941',
                      marginBottom: '12px'
                    }}
                  >
                    <MapPin style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                    <span>{p.location}</span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>/project/{p.id}</span>
                  </div>

                  <p
                    style={{
                      fontSize: '12.5px',
                      lineHeight: '1.6',
                      color: '#5b4130',
                      margin: '0 0 16px',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {p.summary || p.story}
                  </p>

                  {/* Action Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      borderTop: '1px solid rgba(118,89,65,0.15)',
                      marginTop: 'auto'
                    }}
                  >
                    <a
                      href={`/project/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live user page"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        color: '#765941',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      View Live ↗
                    </a>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicate this project"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#765941',
                          padding: '6px'
                        }}
                      >
                        <Copy style={{ width: '15px', height: '15px' }} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#FAF7F2',
                          border: '1px solid rgba(118,89,65,0.3)',
                          borderRadius: '2px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#19120C',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 style={{ width: '13px', height: '13px' }} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Delete project"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#dc2626',
                          padding: '6px'
                        }}
                      >
                        <Trash2 style={{ width: '15px', height: '15px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROJECT EDITOR MODAL (Slide-Over / Full Form) */}
      {/* ========================================================================= */}
      {editingProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(25,18,12,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '3px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid rgba(118,89,65,0.3)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(118,89,65,0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FAF7F2'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#765941'
                  }}
                >
                  {isNew ? 'Create New Entry' : 'Edit Project Showcase'}
                </span>
                <h2
                  style={{
                    fontFamily: 'RoelSerif, Georgia, serif',
                    fontSize: '22px',
                    margin: '2px 0 0',
                    color: '#19120C'
                  }}
                >
                  {isNew ? 'New Architectural Project' : editingProject.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingProject(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#765941',
                  padding: '6px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                {/* Project Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Verandah Residence"
                    value={editingProject.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setEditingProject((prev) => {
                        if (!prev) return null;
                        const autoSlug = isNew ? slugify(newName) : prev.id;
                        return { ...prev, name: newName, id: autoSlug };
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                {/* Project Slug / URL ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    URL Slug / ID * (roelhomes.com/project/<strong style={{ color: '#19120C' }}>{editingProject.id || 'slug'}</strong>)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    placeholder="e.g. the-verandah-residence"
                    value={editingProject.id}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, id: slugify(e.target.value) } : null)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      backgroundColor: isNew ? '#FAF7F2' : 'rgba(0,0,0,0.04)',
                      cursor: isNew ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
              </div>

              {/* Category, Location, Year */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Residential, Commercial"
                    value={editingProject.category}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, category: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2',
                      marginBottom: '6px'
                    }}
                  />
                  {/* Preset Quick Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {CATEGORY_PRESETS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditingProject((prev) => prev ? { ...prev, category: cat } : null)}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: editingProject.category === cat ? '#19120C' : 'rgba(118,89,65,0.1)',
                          color: editingProject.category === cat ? '#F0E2CE' : '#765941',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aluva, Kochi"
                    value={editingProject.location}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, location: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                {/* Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={editingProject.year}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, year: e.target.value } : null)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                {/* Order Index */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingProject.order_index}
                    onChange={(e) => setEditingProject((prev) => prev ? { ...prev, order_index: parseInt(e.target.value) || 1 } : null)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>
              </div>

              {/* Showcase Cover Image */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                  Project Showcase Photo (Cloudflare R2 or URL) *
                </label>
                <ImageDropzone
                  value={editingProject.image_url}
                  onChange={(url) => setEditingProject((prev) => prev ? { ...prev, image_url: url } : null)}
                  folder="projects"
                  hint="Drag & drop project photography or click to upload directly to Cloudflare R2 bucket"
                />
              </div>

              {/* Summary */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                  Short Summary (1-2 sentences shown on gallery cards)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. A warm family living space shaped by continuous timber lines and subtle lighting."
                  value={editingProject.summary}
                  onChange={(e) => setEditingProject((prev) => prev ? { ...prev, summary: e.target.value } : null)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '2px',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                    outline: 'none',
                    backgroundColor: '#FAF7F2',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Story / Architectural Narrative */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#765941', marginBottom: '6px' }}>
                  Architectural Story & Design Details (Shown on /project/{editingProject.id || 'slug'})
                </label>
                <textarea
                  rows={5}
                  placeholder="Write the architectural narrative, craftsmanship details, material finishes, or site context..."
                  value={editingProject.story}
                  onChange={(e) => setEditingProject((prev) => prev ? { ...prev, story: e.target.value } : null)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '2px',
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    outline: 'none',
                    backgroundColor: '#FAF7F2',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(118,89,65,0.18)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(118,89,65,0.3)',
                    color: '#765941',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 600,
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
                    padding: '10px 24px',
                    backgroundColor: '#19120C',
                    color: '#F0E2CE',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(25,18,12,0.2)'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                      Saving to Supabase...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: '15px', height: '15px', color: '#E5BF8C' }} />
                      Save Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
