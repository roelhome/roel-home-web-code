import React, { useState, useEffect, useRef } from 'react';
import { initialProducts } from '../data/products';
import { initialServices } from '../data/services';
import { initialProjects } from '../data/projects';

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Open on search button click
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('#open-search-btn');
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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.classList.remove('no-scroll');
      setQuery('');
    }
  }, [isOpen]);

  // Filter items
  const cleanQ = query.trim().toLowerCase();
  const matchedProducts = cleanQ
    ? initialProducts.filter(p => p.name.toLowerCase().includes(cleanQ) || p.category.toLowerCase().includes(cleanQ) || p.short.toLowerCase().includes(cleanQ))
    : [];
  const matchedServices = cleanQ
    ? initialServices.filter(s => s.name.toLowerCase().includes(cleanQ) || s.summary.toLowerCase().includes(cleanQ))
    : [];
  const matchedProjects = cleanQ
    ? initialProjects.filter(pj => pj.name.toLowerCase().includes(cleanQ) || pj.location.toLowerCase().includes(cleanQ) || pj.category.toLowerCase().includes(cleanQ))
    : [];

  const totalMatches = matchedProducts.length + matchedServices.length + matchedProjects.length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
      <div className="modal-dialog" style={{ width: 'min(680px, 95%)', maxHeight: '80vh', padding: '36px' }}>
        <button 
          className="modal-close" 
          type="button" 
          onClick={() => setIsOpen(false)} 
          aria-label="Close search"
        >
          ×
        </button>

        <span className="eyebrow" style={{ color: 'var(--walnut)' }}>Quick Search</span>
        <div style={{ position: 'relative', margin: '16px 0 24px' }}>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search products, fluted walls, doors, screens, projects..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', fontSize: '18px', padding: '16px 20px', border: '1px solid var(--gold)', borderRadius: '2px', background: '#fff' }}
          />
        </div>

        {cleanQ ? (
          <div>
            <div className="micro muted" style={{ marginBottom: '16px' }}>
              {totalMatches} result{totalMatches === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </div>

            {totalMatches === 0 && (
              <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
                No materials or projects found matching &ldquo;{query}&rdquo;.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '45vh', overflowY: 'auto' }}>
              {matchedProducts.map(p => (
                <a 
                  key={p.id} 
                  href={`/product/${p.id}`} 
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: '2px', transition: 'background 0.2s' }}
                >
                  <img src={p.image} alt={p.name} style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <span className="micro" style={{ color: 'var(--walnut)' }}>{p.category} &nbsp;·&nbsp; {p.sku}</span>
                    <h4 style={{ font: "400 18px 'RoelSerif', serif", margin: '2px 0' }}>{p.name}</h4>
                    <p className="muted" style={{ fontSize: '12px', margin: 0 }}>{p.price}</p>
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--gold)' }}>↗</span>
                </a>
              ))}

              {matchedServices.map(s => (
                <a 
                  key={s.id} 
                  href={`/services#${s.id}`} 
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: '2px' }}
                >
                  <img src={s.image} alt={s.name} style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <span className="micro" style={{ color: 'var(--walnut)' }}>Service / {s.number}</span>
                    <h4 style={{ font: "400 18px 'RoelSerif', serif", margin: '2px 0' }}>{s.name}</h4>
                    <p className="muted" style={{ fontSize: '12px', margin: 0 }}>{s.summary}</p>
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--gold)' }}>↗</span>
                </a>
              ))}

              {matchedProjects.map(pj => (
                <a 
                  key={pj.id} 
                  href={`/project/${pj.id}`} 
                  onClick={() => setIsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: '2px' }}
                >
                  <img src={pj.image} alt={pj.name} style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <span className="micro" style={{ color: 'var(--walnut)' }}>Project &nbsp;·&nbsp; {pj.location}</span>
                    <h4 style={{ font: "400 18px 'RoelSerif', serif", margin: '2px 0' }}>{pj.name}</h4>
                    <p className="muted" style={{ fontSize: '12px', margin: 0 }}>{pj.summary}</p>
                  </div>
                  <span style={{ fontSize: '16px', color: 'var(--gold)' }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 0' }}>
            <span className="micro muted">Quick Suggestions</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {['Wall Panel', 'Door', 'Screen', 'Consultation', 'Kochi', 'Verandah'].map(suggestion => (
                <button 
                  key={suggestion}
                  type="button" 
                  className="filter-chip"
                  onClick={() => setQuery(suggestion)}
                  style={{ fontSize: '11px', padding: '6px 14px' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
