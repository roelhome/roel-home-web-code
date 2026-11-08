import React, { useState, useEffect } from 'react';
import { products as defaultProducts, imgSrc } from '../data/originalData.js';

export default function CatalogueFilter({ initialProducts = defaultProducts }: { initialProducts?: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) setSelectedCategory(cat);
    }
  }, []);

  const categories = ['All', 'Wall Solutions', 'Premium Doors', 'Decorative Accents'];
  const filtered = selectedCategory === 'All'
    ? initialProducts
    : initialProducts.filter(p => p.category === selectedCategory);

  return (
    <div className="container">
      <div className="filter-bar">
        <div className="filter-row" id="catalogue-filters">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-chip ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="micro muted" id="catalogue-count">
          {filtered.length} products
        </div>
      </div>

      <div className="catalogue-note">
        These are illustrative design-stage product listings. Product availability, technical specifications and prices must be confirmed with the ROEL team before publication or ordering.
      </div>

      <div className="product-grid" id="catalogue-list">
        {filtered.map((p) => (
          <article className="product-card" key={p.id}>
            <a className="product-image" href={`/product/${p.id}`} aria-label={`View ${p.name}`}>
              <img src={imgSrc(p.image)} alt={`${p.name} architectural material sample`} loading="lazy" />
              <span className="on-image-tag">{p.category}</span>
              <span className="image-arrow">↗</span>
            </a>
            <div className="product-info">
              <div>
                <div className="micro muted">{p.sku}</div>
                <h3><a href={`/product/${p.id}`}>{p.name}</a></h3>
                <p>{p.short}</p>
              </div>
              <div className="product-price">
                <small>Sample price from</small>
                {p.price}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
