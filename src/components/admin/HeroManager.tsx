import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageDropzone } from './ImageDropzone';
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  Eye,
  X,
  ArrowRight
} from 'lucide-react';

export interface AdminHeroSlide {
  id: string;
  title: string;
  pillar: string;
  subtitle: string;
  description: string;
  image_url: string;
  mobile_image_url: string;
  alt_text: string;
  cta_text: string;
  cta_link: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PILLAR_PRESETS = [
  'DOORS',
  'WALL SOLUTIONS',
  'SURFACES',
  'BESPOKE INTERIORS',
  'ARCHITECTURAL LIVING'
];

export const HeroManager: React.FC = () => {
  const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<AdminHeroSlide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const fetchSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order_index', { ascending: true });

      if (fetchErr) throw fetchErr;

      setSlides(
        (data || []).map((s: any) => ({
          id: s.id,
          title: s.title || '',
          pillar: s.pillar || 'DOORS',
          subtitle: s.subtitle || '',
          description: s.description || '',
          image_url: s.image_url || '',
          mobile_image_url: s.mobile_image_url || '',
          alt_text: s.alt_text || '',
          cta_text: s.cta_text || 'EXPLORE COLLECTIONS',
          cta_link: s.cta_link || '/catalogue',
          order_index: s.order_index ?? 1,
          is_active: s.is_active !== false,
          created_at: s.created_at,
          updated_at: s.updated_at
        }))
      );
    } catch (err: any) {
      console.error('Error fetching hero slides:', err);
      setError(err.message || 'Failed to fetch hero slides from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleStartCreate = () => {
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order_index)) + 1 : 1;
    setEditingSlide({
      id: '',
      title: 'Architectural<br />Solutions for<br />Modern Living',
      pillar: 'DOORS',
      subtitle: '',
      description: 'Premium distinctive doors, engineered frames and bespoke entrance systems designed for luxury interiors.',
      image_url: '/images/hero-doors.jpg',
      mobile_image_url: '',
      alt_text: 'ROEL Architectural Living interior banner',
      cta_text: 'EXPLORE COLLECTIONS',
      cta_link: '/catalogue',
      order_index: nextOrder,
      is_active: true
    });
    setIsNew(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleStartEdit = (slide: AdminHeroSlide) => {
    setEditingSlide({ ...slide });
    setIsNew(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleDuplicate = async (slide: AdminHeroSlide) => {
    try {
      const nextOrder = Math.max(...slides.map((s) => s.order_index), 0) + 1;
      const { error: insertErr } = await supabase
        .from('hero_slides')
        .insert({
          title: `${slide.title} (Copy)`,
          pillar: slide.pillar,
          subtitle: slide.subtitle,
          description: slide.description,
          image_url: slide.image_url,
          mobile_image_url: slide.mobile_image_url,
          alt_text: slide.alt_text,
          cta_text: slide.cta_text,
          cta_link: slide.cta_link,
          order_index: nextOrder,
          is_active: false
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setSuccessMessage('Hero banner duplicated as inactive draft.');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchSlides();
    } catch (err: any) {
      console.error('Error duplicating slide:', err);
      setError(err.message || 'Failed to duplicate banner.');
    }
  };

  const handleToggleActive = async (slide: AdminHeroSlide) => {
    const nextActive = !slide.is_active;
    try {
      const { error: updateErr } = await supabase
        .from('hero_slides')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', slide.id);

      if (updateErr) throw updateErr;

      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, is_active: nextActive } : s))
      );
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error: delErr } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      setSlides((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
      setSuccessMessage('Hero banner deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting slide:', err);
      setError(err.message || 'Failed to delete banner.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (!editingSlide.title.trim()) {
      setError('Slide heading / title is required.');
      return;
    }
    if (!editingSlide.image_url.trim()) {
      setError('Banner image is required. Please upload or provide an image URL.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: editingSlide.title.trim(),
        pillar: (editingSlide.pillar || 'DOORS').trim().toUpperCase(),
        subtitle: editingSlide.subtitle?.trim() || '',
        description: editingSlide.description?.trim() || '',
        image_url: editingSlide.image_url.trim(),
        mobile_image_url: editingSlide.mobile_image_url?.trim() || null,
        alt_text: editingSlide.alt_text?.trim() || null,
        cta_text: editingSlide.cta_text?.trim() || 'EXPLORE COLLECTIONS',
        cta_link: editingSlide.cta_link?.trim() || '/catalogue',
        order_index: Number(editingSlide.order_index) || 1,
        is_active: editingSlide.is_active,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { error: insertErr } = await supabase
          .from('hero_slides')
          .insert(payload);
        if (insertErr) throw insertErr;
      } else {
        const { error: updateErr } = await supabase
          .from('hero_slides')
          .update(payload)
          .eq('id', editingSlide.id);
        if (updateErr) throw updateErr;
      }

      setSuccessMessage(`Hero banner ${isNew ? 'created' : 'updated'} successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setEditingSlide(null);
      fetchSlides();
    } catch (err: any) {
      console.error('Error saving hero slide:', err);
      setError(err.message || 'Failed to save hero banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Toast Notification */}
      {successMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#15803d',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <Check style={{ width: '16px', height: '16px' }} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 7, 5, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '1000px', width: '100%', maxHeight: '90vh' }}>
            <img
              src={previewImageModal}
              alt="Hero Banner Preview"
              style={{
                width: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} /> Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 7, 5, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#19120C', fontWeight: 700 }}>
              Delete Hero Banner?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
              Are you sure you want to remove this hero slide from the homepage? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#dc2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LIST VIEW                                                              */}
      {/* ========================================================================= */}
      {!editingSlide && (
        <div>
          {/* Top Action Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px'
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '24px', margin: '0 0 4px', color: '#19120C' }}>
                Hero Banners & Visual Sliders
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#806957' }}>
                Manage homepage landscape hero slides, headings, background images, and call-to-actions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={fetchSlides}
                title="Refresh banner list"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(118, 89, 65, 0.25)',
                  borderRadius: '4px',
                  color: '#765941',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px' }} />
                Refresh
              </button>

              <button
                onClick={handleStartCreate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  backgroundColor: '#D49E58',
                  color: '#14110E',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(212,158,88,0.3)'
                }}
              >
                <Plus style={{ width: '15px', height: '15px' }} />
                Add Hero Banner
              </button>
            </div>
          </div>

          {/* Banner Table / Cards */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#806957' }}>
              <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#D49E58' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>Loading hero slides...</p>
            </div>
          ) : slides.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px dashed rgba(118, 89, 65, 0.3)',
                padding: '60px 24px',
                textAlign: 'center'
              }}
            >
              <Sparkles style={{ width: '36px', height: '36px', color: '#D49E58', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#19120C' }}>No Hero Banners Found</h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957' }}>
                Add your first landscape visual hero slide for the homepage.
              </p>
              <button
                onClick={handleStartCreate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#D49E58',
                  color: '#14110E',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + Add Hero Banner
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid rgba(118, 89, 65, 0.16)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Order Badge */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#FAF7F2',
                      border: '1px solid rgba(118, 89, 65, 0.2)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#765941',
                      flexShrink: 0
                    }}
                    title={`Slide Order: ${slide.order_index}`}
                  >
                    {slide.order_index}
                  </div>

                  {/* Thumbnail with 16:9 ratio */}
                  <div
                    style={{
                      width: '130px',
                      height: '74px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#14110E',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                    onClick={() => setPreviewImageModal(slide.image_url)}
                    title="Click to view full image"
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.alt_text || slide.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                    >
                      <Eye style={{ width: '18px', height: '18px', color: '#FFFFFF' }} />
                    </div>
                  </div>

                  {/* Text Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(212, 158, 88, 0.15)',
                          color: '#b4772b'
                        }}
                      >
                        {slide.pillar}
                      </span>

                      {!slide.is_active && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b'
                          }}
                        >
                          Draft (Hidden)
                        </span>
                      )}
                    </div>

                    <h4
                      style={{
                        margin: '0 0 4px',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#19120C',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      dangerouslySetInnerHTML={{ __html: slide.title }}
                    />

                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#806957',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '550px'
                      }}
                    >
                      {slide.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#9c8471' }}>
                      <span>CTA: <strong>{slide.cta_text}</strong> &rarr; <code>{slide.cta_link}</code></span>
                      {slide.mobile_image_url && <span>&bull; Mobile image set</span>}
                    </div>
                  </div>

                  {/* Active Switch Toggle */}
                  <button
                    onClick={() => handleToggleActive(slide)}
                    title={slide.is_active ? 'Click to deactivate' : 'Click to activate'}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: slide.is_active ? '#dcfce7' : '#f3f4f6',
                      color: slide.is_active ? '#15803d' : '#6b7280',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: slide.is_active ? '#22c55e' : '#9ca3af'
                      }}
                    />
                    {slide.is_active ? 'Live' : 'Hidden'}
                  </button>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleStartEdit(slide)}
                      title="Edit banner details"
                      style={{
                        padding: '7px 11px',
                        backgroundColor: '#FAF7F2',
                        border: '1px solid rgba(118, 89, 65, 0.2)',
                        borderRadius: '4px',
                        color: '#765941',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit3 style={{ width: '13px', height: '13px' }} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDuplicate(slide)}
                      title="Duplicate banner"
                      style={{
                        padding: '7px 10px',
                        backgroundColor: '#FAF7F2',
                        border: '1px solid rgba(118, 89, 65, 0.2)',
                        borderRadius: '4px',
                        color: '#765941',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy style={{ width: '13px', height: '13px' }} />
                    </button>

                    <button
                      onClick={() => setDeletingId(slide.id)}
                      title="Delete banner"
                      style={{
                        padding: '7px 10px',
                        backgroundColor: '#fff',
                        border: '1px solid #fee2e2',
                        borderRadius: '4px',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE / EDIT FORM VIEW WITH LIVE BANNER PREVIEW                       */}
      {/* ========================================================================= */}
      {editingSlide && (
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setEditingSlide(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#765941',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              &larr; Back to all banners
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(118, 89, 65, 0.25)',
                  borderRadius: '4px',
                  color: '#765941',
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
                  padding: '9px 22px',
                  backgroundColor: '#D49E58',
                  color: '#14110E',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
                {isNew ? 'Create Hero Banner' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* REAL-TIME LIVE HERO BANNER PREVIEW */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#806957' }}>
                Live Visual Preview (Updates as you type)
              </span>
              <span style={{ fontSize: '11px', color: '#9c8471' }}>16:9 Landscape Aspect Ratio</span>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '310px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#14110E',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                border: '1px solid rgba(118, 89, 65, 0.2)'
              }}
            >
              {/* Background Image */}
              {editingSlide.image_url ? (
                <img
                  src={editingSlide.image_url}
                  alt={editingSlide.alt_text || 'Hero Preview'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(240,226,206,0.4)' }}>
                  Upload an image below to see the banner preview
                </div>
              )}

              {/* Architectural Dark Gradient Overlay (Exact match to homepage) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, rgba(20, 17, 14, 0.92) 0%, rgba(20, 17, 14, 0.75) 45%, rgba(20, 17, 14, 0.25) 75%, transparent 100%)'
                }}
              />

              {/* Content Stack Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  padding: '36px 44px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  maxWidth: '560px',
                  color: '#F0E2CE'
                }}
              >
                {/* Eyebrow */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#D49E58',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}
                >
                  <span>{editingSlide.pillar || 'DOORS'}</span>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <span style={{ color: 'rgba(240,226,206,0.6)', fontWeight: 500 }}>ROEL STUDIO</span>
                </div>

                {/* Heading */}
                <h2
                  style={{
                    fontFamily: 'RoelSerif, Georgia, serif',
                    fontSize: '26px',
                    lineHeight: 1.15,
                    margin: '0 0 12px',
                    color: '#F0E2CE',
                    fontWeight: 400
                  }}
                  dangerouslySetInnerHTML={{ __html: editingSlide.title || 'Architectural Solutions' }}
                />

                {/* Description */}
                <p
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'rgba(240, 226, 206, 0.82)',
                    margin: '0 0 18px',
                    maxWidth: '460px'
                  }}
                >
                  {editingSlide.description || 'Premium architectural solutions designed for refined living.'}
                </p>

                {/* CTA Button */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      backgroundColor: 'rgba(20, 17, 14, 0.55)',
                      border: '1px solid rgba(229, 191, 140, 0.6)',
                      borderRadius: '2px',
                      color: '#F0E2CE',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <span>{editingSlide.cta_text || 'EXPLORE COLLECTIONS'}</span>
                    <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Column: Image Uploaders */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid rgba(118, 89, 65, 0.16)' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 16px', color: '#19120C', fontWeight: 700 }}>
                1. Banner Photography (R2 Dropzone)
              </h3>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                  Desktop Landscape Image *
                </label>
                <ImageDropzone
                  folder="hero"
                  multiple={false}
                  onChange={(urls) => {
                    if (urls.length > 0) {
                      setEditingSlide({ ...editingSlide, image_url: urls[0] });
                    }
                  }}
                  label="Drop landscape hero image here"
                  hint="Recommended size: 1920x1080px (16:9). Uploads to Cloudflare R2 bucket."
                />

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#806957', marginBottom: '4px' }}>
                    Or paste direct image URL:
                  </label>
                  <input
                    type="text"
                    value={editingSlide.image_url}
                    onChange={(e) => setEditingSlide({ ...editingSlide, image_url: e.target.value })}
                    placeholder="https://... or /images/hero-doors.jpg"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                  Mobile Portrait Image (Optional)
                </label>
                <ImageDropzone
                  folder="hero"
                  multiple={false}
                  onChange={(urls) => {
                    if (urls.length > 0) {
                      setEditingSlide({ ...editingSlide, mobile_image_url: urls[0] });
                    }
                  }}
                  label="Drop mobile-optimized portrait image (Optional)"
                  hint="Recommended size: 800x1200px. If empty, desktop image is used."
                />

                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    value={editingSlide.mobile_image_url}
                    onChange={(e) => setEditingSlide({ ...editingSlide, mobile_image_url: e.target.value })}
                    placeholder="Mobile image URL (optional)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                  Image Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  value={editingSlide.alt_text}
                  onChange={(e) => setEditingSlide({ ...editingSlide, alt_text: e.target.value })}
                  placeholder="e.g. Modern walnut entrance door with fluted wall paneling"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Right Column: Heading & Content */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid rgba(118, 89, 65, 0.16)' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 16px', color: '#19120C', fontWeight: 700 }}>
                2. Heading & Content Details
              </h3>

              {/* Pillar / Category Eyebrow */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                  Pillar / Category Eyebrow *
                </label>
                <input
                  type="text"
                  value={editingSlide.pillar}
                  onChange={(e) => setEditingSlide({ ...editingSlide, pillar: e.target.value })}
                  placeholder="e.g. DOORS, WALL SOLUTIONS, SURFACES"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase'
                  }}
                />
                {/* Suggestions */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {PILLAR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, pillar: preset })}
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        backgroundColor: '#FAF7F2',
                        border: '1px solid rgba(118, 89, 65, 0.2)',
                        borderRadius: '3px',
                        color: '#765941',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Heading */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#19120C' }}>
                    Main Slide Heading *
                  </label>
                  <span style={{ fontSize: '11px', color: '#806957' }}>Use <code>&lt;br /&gt;</code> for line breaks</span>
                </div>
                <textarea
                  rows={3}
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="Architectural<br />Solutions for<br />Modern Living"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                  Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={editingSlide.description}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  placeholder="Premium distinctive doors, engineered frames and bespoke entrance systems..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(118, 89, 65, 0.25)',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* CTA Text & Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={editingSlide.cta_text}
                    onChange={(e) => setEditingSlide({ ...editingSlide, cta_text: e.target.value })}
                    placeholder="EXPLORE COLLECTIONS"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                    CTA Target Link
                  </label>
                  <input
                    type="text"
                    value={editingSlide.cta_link}
                    onChange={(e) => setEditingSlide({ ...editingSlide, cta_link: e.target.value })}
                    placeholder="/catalogue"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Ordering & Active Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(118, 89, 65, 0.15)', paddingTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#19120C', marginBottom: '6px' }}>
                    Slide Order (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={editingSlide.order_index}
                    onChange={(e) => setEditingSlide({ ...editingSlide, order_index: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(118, 89, 65, 0.25)',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#19120C' }}>
                    <input
                      type="checkbox"
                      checked={editingSlide.is_active}
                      onChange={(e) => setEditingSlide({ ...editingSlide, is_active: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#D49E58', cursor: 'pointer' }}
                    />
                    Active on live website
                  </label>
                  <span style={{ fontSize: '11px', color: '#806957', marginTop: '4px' }}>
                    Uncheck to keep as draft without showing to visitors.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
