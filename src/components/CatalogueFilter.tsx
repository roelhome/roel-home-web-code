import { useState, useEffect } from 'react';
import { imgSrc } from '../data/originalData.js';
import { supabase, type CategoryItem } from '../lib/supabase';
import { type Product } from '../data/products';

interface CatalogueFilterProps {
  initialProducts?: Product[];
  initialCategories?: CategoryItem[];
}

export default function CatalogueFilter({
  initialProducts = [],
  initialCategories = []
}: CatalogueFilterProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // 1. Check URL query params for initial category
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) setSelectedCategory(cat);
    }

    // 2. Fetch fresh published products and categories directly from Supabase
    const fetchFreshData = async () => {
      try {
        const [{ data: prodData }, { data: catData }] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .order('order_index', { ascending: true })
        ]);

        if (prodData && prodData.length > 0) {
          setProducts(
            prodData.map((item: any) => ({
              id: item.id,
              sku: item.sku,
              category: item.category_id || 'Architectural Material',
              name: item.name,
              short: item.short_desc || '',
              description: item.description || '',
              price: item.price || '',
              image: item.image_url || '/images/slat.webp',
              specs: Array.isArray(item.specs) ? item.specs : [],
              applications: item.applications || '',
              is_featured: !!item.is_featured,
              status: item.status || 'published',
              variants: Array.isArray(item.variants) ? item.variants : [],
              gallery: Array.isArray(item.gallery) ? item.gallery : []
            }))
          );
        }

        if (catData && catData.length > 0) {
          setCategories(catData);
        }
      } catch (err) {
        console.warn('Live catalogue fetch error:', err);
      }
    };

    fetchFreshData();
  }, []);

  // Build category list: "All" + all category names
  const categoryNames = [
    'All',
    ...Array.from(new Set(categories.map((c) => c.name))).filter(Boolean)
  ];

  // If no categories loaded yet, fallback to default
  const displayCategories =
    categoryNames.length > 1
      ? categoryNames
      : ['All', 'Wall Solutions', 'Premium Doors', 'Decorative Accents'];

  const filtered =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="container">
      <div className="filter-bar">
        <div className="filter-row" id="catalogue-filters">
          {displayCategories.map((c) => (
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

      <div className="product-grid" id="catalogue-list">
        {filtered.map((p) => {
          const waMessage = `Hello ROEL Home Solutions, I would like to enquire about ${p.name} (${p.sku}). Please share details and a quotation.`;
          const waLink = `https://wa.me/918111899991?text=${encodeURIComponent(waMessage)}`;

          return (
            <article className="product-card" key={p.id}>
              <a className="product-image" href={`/product/${p.id}`} aria-label={`View ${p.name}`}>
                <img
                  src={imgSrc(p.image)}
                  alt={`${p.name} architectural material sample`}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/slat.webp';
                  }}
                />
                <span className="on-image-tag">
                  {p.category}
                  {p.variants && p.variants.length > 1 ? ` • ${p.variants.length} Options` : ''}
                </span>
              </a>
              <div className="product-info">
                <div>
                  <div className="micro muted">{p.sku}</div>
                  <h3>
                    <a href={`/product/${p.id}`}>{p.name}</a>
                  </h3>
                  {p.short && <p>{p.short}</p>}
                </div>
                <div className="product-price">
                  <small>
                    {p.variants && p.variants.length > 1 ? `${p.variants.length} Options from` : 'Starting from'}
                  </small>
                  <span>{p.price}</span>
                </div>
              </div>
              <div className="product-actions">
                <a
                  href={`/product/${p.id}`}
                  className="product-btn-view"
                  aria-label={`View details of ${p.name}`}
                >
                  <span>View Details</span>
                  <span className="product-btn-arrow" aria-hidden="true">→</span>
                </a>
                <span className="product-actions-divider" aria-hidden="true" />
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-btn-enquire"
                  aria-label={`Enquire about ${p.name} on WhatsApp`}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="product-wa-icon"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.929.809 2.062c.099.134 1.39 2.123 3.37 2.978.472.203.84.324 1.127.416.474.152.905.13 1.246.08.38-.058 1.17-.479 1.338-.942.166-.464.166-.86.116-.942-.049-.082-.181-.133-.379-.232"
                    />
                  </svg>
                  <span>Enquire</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
