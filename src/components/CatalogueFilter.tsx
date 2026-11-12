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

      <div className="catalogue-note">
        These are architectural product listings from ROEL Home Solutions. Product availability, technical specifications and customized finish options can be discussed with our studio team.
      </div>

      <div className="product-grid" id="catalogue-list">
        {filtered.map((p) => (
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
              <div className="product-price">
                <small>
                  {p.variants && p.variants.length > 1 ? `${p.variants.length} Options from` : 'Starting from'}
                </small>
                {p.price}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
