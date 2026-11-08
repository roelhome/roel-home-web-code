import React, { useState, useEffect } from 'react';
import type { Product } from '../data/products';

interface Props {
  initialProducts: Product[];
  initialCategory?: string;
}

export default function CatalogueFilter({ initialProducts, initialCategory = 'All' }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    // Check URL parameters on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      if (catParam) {
        setSelectedCategory(catParam);
      }
    }
  }, []);

  const categories = ['All', 'Wall Solutions', 'Premium Doors', 'Decorative Accents'];

  const filteredProducts = selectedCategory === 'All'
    ? initialProducts
    : initialProducts.filter(p => p.category === selectedCategory);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="micro muted">
          {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((p) => (
          <article key={p.id} className="product-card">
            <a href={`/product/${p.id}`} className="product-image" aria-label={`View details for ${p.name}`}>
              <img src={p.image} alt={`${p.name} sample architectural material`} loading="lazy" />
              <span className="on-image-tag">{p.category}</span>
              <span className="image-arrow">↗</span>
            </a>
            <div className="product-info">
              <div>
                <div className="micro muted">{p.sku}</div>
                <h3>
                  <a href={`/product/${p.id}`}>{p.name}</a>
                </h3>
                <p>{p.short}</p>
              </div>
              <div className="product-price">{p.price}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
