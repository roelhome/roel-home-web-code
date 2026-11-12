import { useState, useEffect, useRef } from 'react';

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
      className="modal-root open" 
      data-lenis-prevent="true"
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="modal-shade" 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div 
        className="modal-dialog video-dialog" 
        data-lenis-prevent="true"
      >
        <div className="modal-inner">
          <div className="video-top">
            <p>ROEL / materials in motion &nbsp; · &nbsp; visual concept preview</p>
            <button 
              className="modal-close" 
              type="button" 
              onClick={() => setIsOpen(false)} 
              aria-label="Close film"
            >
              ×
            </button>
          </div>
          <video 
            ref={videoRef}
            src="/videos/video.mp4" 
            poster="/images/hero.webp"
            controls 
            playsInline 
            autoPlay
            preload="metadata"
            aria-label="ROEL architectural visual concept preview"
          >
            Your browser does not support HTML video.
          </video>
          <p style={{ fontSize: '10px', color: 'var(--champagne)', margin: '11px 4px 0', lineHeight: 1.6 }}>
            Illustrative mood film assembled from reference imagery — showcasing architectural materials and light.
          </p>
        </div>
      </div>
    </div>
  );
}
