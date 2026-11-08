import React, { useState, useEffect, useRef } from 'react';

export default function BrandFilmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-play-film]');
      if (target) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleTrigger);
    return () => document.removeEventListener('click', handleTrigger);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
      if ((window as any).roelLenis) {
        (window as any).roelLenis.stop();
      }
      setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, 100);
    } else {
      document.body.classList.remove('no-scroll');
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if ((window as any).roelLenis) {
        (window as any).roelLenis.start();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay open" 
      data-lenis-prevent="true"
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div 
        className="modal-dialog video-dialog" 
        data-lenis-prevent="true"
        role="dialog" 
        aria-modal="true" 
        aria-label="Brand Film Preview"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ color: 'var(--champagne)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
            ROEL / Materials in motion &nbsp;·&nbsp; Design preview
          </p>
          <button 
            className="modal-close" 
            type="button" 
            onClick={() => setIsOpen(false)} 
            aria-label="Close brand film"
          >
            ×
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
          <video 
            ref={videoRef}
            src="/videos/video.mp4" 
            poster="/images/hero.webp"
            controls 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            aria-label="ROEL architectural visual concept preview"
          />
        </div>
      </div>
    </div>
  );
}
