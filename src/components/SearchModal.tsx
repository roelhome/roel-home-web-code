import React, { useState, useEffect, useRef } from 'react';
import { products, services, projects } from '../data/originalData.js';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Open on search button click
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('#search-trigger');
      if (target) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    // Keyboard shortcuts: '/' or 'Ctrl+K'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      } else if (
        (e.key === '/' && !isOpen && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || '')) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleTrigger);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
      if ((window as any).roelLenis) {
        (window as any).roelLenis.stop();
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.classList.remove('no-scroll');
      if ((window as any).roelLenis) {
        (window as any).roelLenis.start();
      }
      setQuery('');
    }
  }, [isOpen]);

  const searchItems = [
    ...products.map((p) => ({
      title: p.name,
      type: 'Product',
      url: `/product/${p.id}`,
      desc: p.category
    })),
    ...services.map((s) => ({
      title: s.name,
      type: 'Service',
      url: `/service/${s.id}`,
      desc: s.tag || s.summary
    })),
    ...projects.map((p) => ({
      title: p.name,
      type: 'Project',
      url: `/project/${p.id}`,
      desc: p.location
    })),
    {
      title: 'Our Story',
      type: 'Information',
      url: '/about',
      desc: 'The ROEL philosophy & values'
    },
    {
      title: 'Contact us',
      type: 'Information',
      url: '/contact',
      desc: 'Visit, phone and consultation enquiry'
    }
  ];

  const cleanQ = query.trim().toLowerCase();
  const matched = cleanQ
    ? searchItems.filter((x) =>
        (x.title + ' ' + x.desc + ' ' + x.type).toLowerCase().includes(cleanQ)
      ).slice(0, 10)
    : searchItems.slice(0, 5);

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
        className="modal-dialog search-box" 
        data-lenis-prevent="true"
      >
        <div className="search-head">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#765941" strokeWidth="1.8">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input 
            ref={inputRef}
            type="search" 
            id="site-search" 
            placeholder="Search materials, services, projects..." 
            aria-label="Search ROEL website" 
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="button" 
            className="modal-close" 
            onClick={() => setIsOpen(false)} 
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <div className="search-results" id="search-results">
          {matched.length > 0 ? (
            matched.map((item, idx) => (
              <a 
                key={idx} 
                className="search-result" 
                href={item.url}
                onClick={() => setIsOpen(false)}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.type} / {item.desc}</small>
                </span>
                <span className="arrow">↗</span>
              </a>
            ))
          ) : (
            <p style={{ padding: '22px 0', color: 'var(--muted)' }}>
              No results for "{query}". Try “doors”, “materials”, “wall” or “projects”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
