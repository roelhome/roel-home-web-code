import React, { useState, useEffect, useRef } from 'react';
import { products as defaultProducts, services as defaultServices, projects as defaultProjects } from '../data/originalData.js';
import { supabase } from '../lib/supabase';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [productsList, setProductsList] = useState<any[]>(defaultProducts);
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

    // Fetch fresh published products from Supabase
    supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProductsList(data);
        }
      });

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
    ...productsList.map((p) => ({
      title: p.name,
      type: 'Product',
      url: `/product/${p.id}`,
      desc: p.category_id || p.category || 'Architectural Material'
    })),
    ...defaultServices.map((s) => ({
      title: s.name,
      type: 'Service',
      url: `/service/${s.id}`,
      desc: s.tag || s.summary
    })),
    ...defaultProjects.map((p) => ({
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      onClick={() => setIsOpen(false)}
    >
      <div className="modal-shade" />
      <div
        className="modal-dialog search-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-head">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ opacity: 0.6 }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="search"
            id="search-modal-title"
            placeholder="Search products, finishes, services..."
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

        <div className="search-results">
          {matched.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No architectural materials found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            matched.map((item) => (
              <a
                key={item.url}
                href={item.url}
                className="search-result"
                onClick={() => setIsOpen(false)}
              >
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.type} — {item.desc}</small>
                </div>
                <span className="arrow">↗</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
