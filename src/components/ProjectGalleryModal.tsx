import React, { useState, useEffect, useCallback } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ProjectGalleryProps {
  project: {
    id: string;
    name: string;
    location?: string;
    category?: string;
    year?: string;
    image: string;
    gallery?: string[];
  };
}

export const ProjectGalleryModal: React.FC<ProjectGalleryProps> = ({ project }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine cover image + gallery images (remove duplicates)
  const allImages = React.useMemo(() => {
    const list = [project.image, ...(project.gallery || [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [project.image, project.gallery]);

  const hasMultiple = allImages.length > 1;

  // Open modal
  const openGallery = (index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  // Close modal
  const closeGallery = () => {
    setIsOpen(false);
  };

  // Next / Prev handlers
  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, nextPhoto, prevPhoto]);

  // Check URL query for #gallery or ?gallery=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('gallery') === 'true' || window.location.hash === '#gallery') {
        setIsOpen(true);
      }
    }
  }, []);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. HERO PHOTO OVERLAY & "PROJECT GALLERY" BUTTON                           */}
      {/* ========================================================================= */}
      <div
        className="project-photo-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '2px',
          cursor: hasMultiple ? 'pointer' : 'default'
        }}
        onClick={() => hasMultiple && openGallery(0)}
      >
        <img
          src={project.image}
          alt={`${project.name} project showcase`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="eager"
        />

        {/* Floating Project Gallery Button over Cover Photo */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openGallery(0);
            }}
            aria-label={`View ${allImages.length} photos in project gallery`}
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              backgroundColor: 'rgba(20, 17, 14, 0.88)',
              color: '#F0E2CE',
              border: '1px solid rgba(229, 191, 140, 0.45)',
              borderRadius: '2px',
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <Camera style={{ width: '15px', height: '15px', color: '#D49E58' }} />
            <span>Project Gallery • {allImages.length} Photos</span>
            <Maximize2 style={{ width: '12px', height: '12px', opacity: 0.7 }} />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SECONDARY BUTTON FOR STORY SECTION (Optional Trigger)                  */}
      {/* ========================================================================= */}
      {hasMultiple && (
        <div style={{ marginTop: '16px' }} id="project-gallery-story-btn">
          <button
            type="button"
            onClick={() => openGallery(0)}
            className="btn outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Camera style={{ width: '15px', height: '15px', color: '#D49E58' }} />
            View Project Gallery ({allImages.length} Photos) <span className="arrow">↗</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FULL-SCREEN LIGHTBOX GALLERY MODAL                                     */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} Architectural Photo Gallery`}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 7, 5, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px clamp(16px, 4vw, 40px)',
            boxSizing: 'border-box',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
          onClick={closeGallery}
        >
          {/* Top Bar: Title, Counter & Close */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(229, 191, 140, 0.15)',
              zIndex: 10
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#D49E58'
                }}
              >
                Project Gallery • {project.category || 'Architectural Space'}
              </span>
              <h2
                style={{
                  fontFamily: 'RoelSerif, Georgia, serif',
                  fontSize: 'clamp(18px, 2.5vw, 24px)',
                  fontWeight: 400,
                  color: '#F0E2CE',
                  margin: 0
                }}
              >
                {project.name}
                {project.location ? (
                  <span style={{ fontSize: '13px', color: 'rgba(240,226,206,0.6)', marginLeft: '12px' }}>
                    — {project.location}
                  </span>
                ) : null}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#E5BF8C',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(229, 191, 140, 0.12)',
                  padding: '4px 10px',
                  borderRadius: '2px'
                }}
              >
                {String(currentIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={closeGallery}
                title="Close Gallery (Esc)"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(229, 191, 140, 0.25)',
                  color: '#F0E2CE',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Main Visual Display (Center) */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            {hasMultiple && (
              <button
                type="button"
                onClick={prevPhoto}
                title="Previous Photo (Left Arrow)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(20, 17, 14, 0.75)',
                  border: '1px solid rgba(229, 191, 140, 0.3)',
                  color: '#F0E2CE',
                  cursor: 'pointer',
                  padding: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronLeft style={{ width: '22px', height: '22px', color: '#E5BF8C' }} />
              </button>
            )}

            {/* Current Image */}
            <div
              style={{
                maxWidth: '1200px',
                maxHeight: 'calc(100vh - 240px)',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                key={currentIndex}
                src={allImages[currentIndex]}
                alt={`${project.name} gallery photograph ${currentIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  borderRadius: '2px',
                  animation: 'fadeIn 0.25s ease'
                }}
              />
            </div>

            {/* Next Arrow */}
            {hasMultiple && (
              <button
                type="button"
                onClick={nextPhoto}
                title="Next Photo (Right Arrow)"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(20, 17, 14, 0.75)',
                  border: '1px solid rgba(229, 191, 140, 0.3)',
                  color: '#F0E2CE',
                  cursor: 'pointer',
                  padding: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronRight style={{ width: '22px', height: '22px', color: '#E5BF8C' }} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {hasMultiple && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(229, 191, 140, 0.12)',
                overflowX: 'auto',
                maxWidth: '100%',
                zIndex: 10
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    title={`Jump to photo ${idx + 1}`}
                    style={{
                      width: '64px',
                      height: '46px',
                      padding: 0,
                      border: isActive
                        ? '2px solid #D49E58'
                        : '1px solid rgba(229, 191, 140, 0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#19120C',
                      opacity: isActive ? 1 : 0.5,
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};
