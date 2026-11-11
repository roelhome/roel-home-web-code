import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { type Product, type ProductVariant, type ProductOption } from '../../data/products';
import { ImageDropzone } from './ImageDropzone';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Check,
  Star,
  Layers,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Camera,
  Sparkles,
  Zap,
  Sliders
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Editing state: null = list view, object = editing existing or new
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: prodData, error: prodErr }, { data: catData, error: catErr }] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('order_index', { ascending: true })
      ]);

      if (prodErr) console.error('Error fetching products:', prodErr);
      if (catErr) console.error('Error fetching categories:', catErr);

      setProducts(
        (prodData || []).map((p: any) => ({
          id: p.id,
          sku: p.sku,
          category: p.category_id || '',
          name: p.name,
          short: p.short_desc || '',
          description: p.description || '',
          price: p.price || '',
          image: p.image_url || '/images/slat.webp',
          specs: Array.isArray(p.specs) ? p.specs : [],
          applications: p.applications || '',
          is_featured: !!p.is_featured,
          status: p.status || 'published',
          options: Array.isArray(p.options) ? p.options : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          gallery: Array.isArray(p.gallery) ? p.gallery : []
        }))
      );

      setCategories(catData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartCreate = () => {
    setIsNew(true);
    setEditingProduct({
      id: '',
      sku: 'ROEL / ',
      category: categories[0]?.id || 'Wall Solutions',
      name: '',
      short: '',
      description: '',
      price: '',
      image: '',
      specs: ['Architectural profile', 'Interior application', 'Custom dimensions available'],
      applications: '',
      is_featured: true,
      status: 'published',
      options: [
        {
          id: 'opt_mat',
          name: 'Material',
          values: [{ name: 'Wooden' }, { name: 'Steel' }]
        },
        {
          id: 'opt_col',
          name: 'Color',
          values: [
            { name: 'Red', color: '#dc2626' },
            { name: 'Yellow', color: '#eab308' }
          ]
        }
      ],
      variants: [],
      gallery: []
    });
  };

  const handleStartEdit = (prod: Product) => {
    setIsNew(false);
    let initialOptions = prod.options || [];

    // Backward compatibility: If options is empty but variants exist, derive initial options
    if ((!initialOptions || initialOptions.length === 0) && prod.variants && prod.variants.length > 0) {
      const dimsMap = new Map<string, Set<string>>();
      prod.variants.forEach((v) => {
        if (v.options && Object.keys(v.options).length > 0) {
          Object.entries(v.options).forEach(([dim, val]) => {
            if (!dimsMap.has(dim)) dimsMap.set(dim, new Set());
            dimsMap.get(dim)!.add(val);
          });
        } else if (v.attribute_type && v.name) {
          if (!dimsMap.has(v.attribute_type)) dimsMap.set(v.attribute_type, new Set());
          dimsMap.get(v.attribute_type)!.add(v.name);
        }
      });

      if (dimsMap.size > 0) {
        initialOptions = Array.from(dimsMap.entries()).map(([name, vals], idx) => ({
          id: `opt_${idx}_${Date.now()}`,
          name,
          values: Array.from(vals).map((v) => ({ name: v }))
        }));
      }
    }

    setEditingProduct({
      ...prod,
      options: initialOptions
    });
  };

  const handleDuplicate = (prod: Product) => {
    setIsNew(true);
    setEditingProduct({
      ...prod,
      id: `${prod.id}-copy`,
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`
    });
  };

  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${prod.name}"?`)) return;

    try {
      const { error: delErr } = await supabase.from('products').delete().eq('id', prod.id);
      if (delErr) throw delErr;

      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err?.message || 'Failed to delete product');
    }
  };

  const handleToggleFeatured = async (prod: Product) => {
    const next = !prod.is_featured;
    try {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ is_featured: next })
        .eq('id', prod.id);

      if (updateErr) throw updateErr;

      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_featured: next } : p))
      );
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name || !editingProduct.sku) {
      setError('Please provide at least a Product Name and SKU.');
      return;
    }

    // Generate slug id if missing
    let prodId = editingProduct.id?.trim();
    if (!prodId) {
      prodId = editingProduct
        .name!.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    setSaving(true);
    setError(null);

    const payload = {
      id: prodId,
      sku: editingProduct.sku,
      category_id: editingProduct.category || null,
      name: editingProduct.name,
      short_desc: editingProduct.short || '',
      description: editingProduct.description || '',
      price: editingProduct.price || '',
      image_url: editingProduct.image || '/images/slat.webp',
      specs: editingProduct.specs || [],
      applications: editingProduct.applications || '',
      is_featured: !!editingProduct.is_featured,
      status: editingProduct.status || 'published',
      options: editingProduct.options || [],
      variants: editingProduct.variants || [],
      gallery: editingProduct.gallery || []
    };

    try {
      if (isNew) {
        const { error: insertErr } = await supabase.from('products').insert([payload]);
        if (insertErr) throw insertErr;
      } else {
        const { error: updateErr } = await supabase
          .from('products')
          .update(payload)
          .eq('id', prodId);
        if (updateErr) throw updateErr;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchData();
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Save product error:', err);
      setError(err?.message || 'Failed to save product to Supabase');
    } finally {
      setSaving(false);
    }
  };

  // Photo toggle state for variant cards
  const [openPhotos, setOpenPhotos] = useState<Record<string, boolean>>({});
  const togglePhotos = (key: string) => {
    setOpenPhotos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // State for typing new option values into Option Dimension boxes
  const [newValName, setNewValName] = useState<Record<string, string>>({});
  const [newValColor, setNewValColor] = useState<Record<string, string>>({});
  const [newValHasColor, setNewValHasColor] = useState<Record<string, boolean>>({});

  // Bulk pricing states
  const [bulkPriceFilter, setBulkPriceFilter] = useState<string>('all');
  const [bulkPriceAmount, setBulkPriceAmount] = useState<string>('');

  // -------------------------------------------------------------
  // STAGE 1: OPTION DIMENSIONS HELPERS
  // -------------------------------------------------------------
  const addOptionDimension = (name = 'Material') => {
    if (!editingProduct) return;
    const current = editingProduct.options || [];
    const newDim: ProductOption = {
      id: `opt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      name,
      values: []
    };
    setEditingProduct({
      ...editingProduct,
      options: [...current, newDim]
    });
  };

  const removeOptionDimension = (dimIdx: number) => {
    if (!editingProduct || !editingProduct.options) return;
    const dim = editingProduct.options[dimIdx];
    if (!window.confirm(`Remove option dimension "${dim.name}" and all its values?`)) return;
    const updated = editingProduct.options.filter((_, i) => i !== dimIdx);
    setEditingProduct({ ...editingProduct, options: updated });
  };

  const renameOptionDimension = (dimIdx: number, newName: string) => {
    if (!editingProduct || !editingProduct.options) return;
    const updated = [...editingProduct.options];
    updated[dimIdx] = { ...updated[dimIdx], name: newName };
    setEditingProduct({ ...editingProduct, options: updated });
  };

  const addOptionValue = (dimIdx: number) => {
    if (!editingProduct || !editingProduct.options) return;
    const dim = editingProduct.options[dimIdx];
    let valText = (newValName[dim.id] || '').trim();

    const hasSwatch = newValHasColor[dim.id] || dim.name.toLowerCase().includes('color') || dim.name.toLowerCase().includes('finish');
    const swatchColor = hasSwatch ? (newValColor[dim.id] || '#765941') : undefined;

    // Fallback: If user picked a color but left name blank, use swatch hex
    if (!valText && hasSwatch && swatchColor) {
      valText = swatchColor;
    }
    if (!valText) return;

    const updated = [...editingProduct.options];
    const currentValues = updated[dimIdx].values || [];

    // Avoid duplicate values
    if (currentValues.some(v => v.name.toLowerCase() === valText.toLowerCase())) {
      alert(`Value "${valText}" already exists in ${dim.name}.`);
      return;
    }

    updated[dimIdx] = {
      ...updated[dimIdx],
      values: [...currentValues, { name: valText, color: swatchColor }]
    };

    setEditingProduct({ ...editingProduct, options: updated });
    setNewValName((prev) => ({ ...prev, [dim.id]: '' }));
  };

  const removeOptionValue = (dimIdx: number, valIdx: number) => {
    if (!editingProduct || !editingProduct.options) return;
    const updated = [...editingProduct.options];
    updated[dimIdx] = {
      ...updated[dimIdx],
      values: updated[dimIdx].values.filter((_, i) => i !== valIdx)
    };
    setEditingProduct({ ...editingProduct, options: updated });
  };

  // -------------------------------------------------------------
  // CARTESIAN GENERATOR (O₁ × O₂ × ... × Oₖ)
  // -------------------------------------------------------------
  const generateCartesianCombinations = () => {
    if (!editingProduct) return;
    const options = (editingProduct.options || []).filter(o => o.values && o.values.length > 0);
    if (options.length === 0) {
      alert('Please add at least one attribute dimension with at least one value first (e.g. Material or Color).');
      return;
    }

    const cartesian = (arrays: any[][]): any[][] =>
      arrays.reduce((acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])), [[]]);

    const valueArrays = options.map(opt =>
      opt.values.map(val => ({
        dimName: opt.name,
        valName: val.name,
        color: val.color
      }))
    );

    const combinations = cartesian(valueArrays);
    const existingVariants = editingProduct.variants || [];

    const newVariants: ProductVariant[] = combinations.map((combo, idx) => {
      const optionMap: Record<string, string> = {};
      const titleParts: string[] = [];
      let swatchColor: string | undefined = undefined;

      combo.forEach((item: any) => {
        optionMap[item.dimName] = item.valName;
        titleParts.push(item.valName);
        if (item.color) swatchColor = item.color;
      });

      const title = titleParts.join(' / ');

      // Check if this exact combination already exists in existingVariants to PRESERVE price & photos!
      const existing = existingVariants.find(ev => {
        if (ev.options && Object.keys(ev.options).length > 0) {
          return Object.entries(optionMap).every(([k, v]) => ev.options?.[k] === v);
        }
        return ev.name === title;
      });

      if (existing) {
        return {
          ...existing,
          name: title,
          title: title,
          options: optionMap,
          color: swatchColor || existing.color,
          has_color: !!swatchColor || existing.has_color,
          is_available: existing.is_available !== false
        };
      }

      // Generate a clean SKU suffix: e.g. ROEL/WL-01-WD-RD
      const codeSuffix = titleParts.map(p => p.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
      const defaultSku = `${editingProduct.sku || 'ROEL'}-${codeSuffix || (idx + 1)}`;

      return {
        id: `var_${Date.now().toString(36)}_${idx}`,
        name: title,
        title: title,
        options: optionMap,
        sku: defaultSku,
        price: editingProduct.price || '',
        images: [],
        color: swatchColor,
        has_color: !!swatchColor,
        is_available: true
      };
    });

    setEditingProduct({
      ...editingProduct,
      variants: newVariants
    });
  };

  // -------------------------------------------------------------
  // STAGE 2: VARIANT COMBINATIONS ROW OPERATIONS
  // -------------------------------------------------------------
  const updateVariantRow = (vIdx: number, updates: Partial<ProductVariant>) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = [...editingProduct.variants];
    updated[vIdx] = { ...updated[vIdx], ...updates };
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  const removeVariantRow = (vIdx: number) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = editingProduct.variants.filter((_, idx) => idx !== vIdx);
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  const applyBulkPrice = () => {
    if (!editingProduct || !editingProduct.variants) return;
    if (!bulkPriceAmount.trim()) {
      alert('Please enter a price to apply (e.g. ₹18,000).');
      return;
    }

    const updated = editingProduct.variants.map((v) => {
      if (!bulkPriceFilter || bulkPriceFilter === 'all') {
        return { ...v, price: bulkPriceAmount.trim() };
      }

      // Filter format is "dimName:::valName"
      const [dimName, valName] = bulkPriceFilter.split(':::');
      if (v.options && v.options[dimName] === valName) {
        return { ...v, price: bulkPriceAmount.trim() };
      }
      if (v.name.includes(valName)) {
        return { ...v, price: bulkPriceAmount.trim() };
      }
      return v;
    });

    setEditingProduct({ ...editingProduct, variants: updated });
    setBulkPriceAmount('');
  };

  // Spec list helpers
  const addSpec = () => {
    if (!editingProduct) return;
    const currentSpecs = editingProduct.specs || [];
    setEditingProduct({ ...editingProduct, specs: [...currentSpecs, ''] });
  };

  const updateSpec = (index: number, val: string) => {
    if (!editingProduct || !editingProduct.specs) return;
    const updated = [...editingProduct.specs];
    updated[index] = val;
    setEditingProduct({ ...editingProduct, specs: updated });
  };

  const removeSpec = (index: number) => {
    if (!editingProduct || !editingProduct.specs) return;
    const updated = editingProduct.specs.filter((_, idx) => idx !== index);
    setEditingProduct({ ...editingProduct, specs: updated });
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  // =========================================================================
  // VIEW: PRODUCT EDITOR (CREATE / EDIT)
  // =========================================================================
  if (editingProduct) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Editor Top Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fff',
            padding: '18px 24px',
            border: '1px solid rgba(118,89,65,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid rgba(118,89,65,0.25)',
                color: '#765941',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Back to Catalog
            </button>
            <h2
              style={{
                fontFamily: 'RoelSerif, Georgia, serif',
                fontSize: '24px',
                margin: 0,
                color: '#19120C'
              }}
            >
              {isNew ? 'Create New Architectural Product' : `Edit: ${editingProduct.name || 'Untitled'}`}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveSuccess && (
              <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check style={{ width: '15px', height: '15px' }} />
                Saved to Supabase!
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={saving}
              style={{
                padding: '11px 24px',
                backgroundColor: '#19120C',
                color: '#F0E2CE',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {saving ? (
                <>
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  Saving to Cloud...
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '14px 20px',
              borderLeft: '4px solid #dc2626',
              fontSize: '13px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
          {/* Left Column: Core Fields & Variants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Core Details Card */}
            <div style={{ backgroundColor: '#fff', padding: '28px', border: '1px solid rgba(118,89,65,0.2)' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 20px', color: '#19120C' }}>
                1. General Product Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Walnut Fluted Wall Panel"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROEL / WL-01"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                    Price Display
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹420 / sq. ft. or ₹18,500 / unit"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Short Summary (Used in cards & previews)
                </label>
                <input
                  type="text"
                  placeholder="A rhythmic wall surface with natural warmth and understated depth."
                  value={editingProduct.short || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Architectural Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed material story, tactile qualities, fabrication notes..."
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Applications
                </label>
                <input
                  type="text"
                  placeholder="Living room feature walls, entry foyers, media backdrops..."
                  value={editingProduct.applications || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, applications: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Product Multi-Dimensional Variants Studio */}
            <div style={{ backgroundColor: '#fff', padding: '28px', border: '1px solid rgba(118,89,65,0.2)' }}>
              {/* Section Header */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '22px', margin: '0 0 6px', color: '#19120C' }}>
                      2. Multi-Dimensional Variants & Combinations Studio
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#806957', maxWidth: '780px', lineHeight: 1.5 }}>
                      Configure attributes such as <strong>Material</strong> (Wooden, Steel) and <strong>Color</strong> (Red, Yellow). The Cartesian Engine creates all real combination SKUs (e.g. <em>Wooden / Red</em>, <em>Steel / Red</em>), each with its own <strong>independent price</strong>, SKU, and Cloudflare R2 photos!
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => addOptionDimension('Material')}
                      style={{ padding: '7px 12px', backgroundColor: 'rgba(118,89,65,0.1)', color: '#765941', border: '1px solid rgba(118,89,65,0.25)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      🪵 + Material Dimension
                    </button>
                    <button
                      type="button"
                      onClick={() => addOptionDimension('Color')}
                      style={{ padding: '7px 12px', backgroundColor: 'rgba(118,89,65,0.1)', color: '#765941', border: '1px solid rgba(118,89,65,0.25)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      🎨 + Color Dimension
                    </button>
                    <button
                      type="button"
                      onClick={() => addOptionDimension('Size / Dimensions')}
                      style={{ padding: '7px 12px', backgroundColor: 'rgba(118,89,65,0.1)', color: '#765941', border: '1px solid rgba(118,89,65,0.25)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      📏 + Size Dimension
                    </button>
                    <button
                      type="button"
                      onClick={() => addOptionDimension('Custom Attribute')}
                      style={{ padding: '7px 12px', backgroundColor: '#765941', color: '#F0E2CE', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus style={{ width: '13px', height: '13px' }} />
                      + Custom Dimension
                    </button>
                  </div>
                </div>
              </div>

              {/* STAGE 1: OPTION DIMENSIONS BOXES */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#765941', backgroundColor: 'rgba(118,89,65,0.12)', padding: '3px 8px', borderRadius: '2px' }}>
                    Stage 1: Define Attribute Dimensions & Values
                  </span>
                </div>

                {(!editingProduct.options || editingProduct.options.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F0E2CE', border: '1px dashed rgba(118,89,65,0.35)', color: '#765941' }}>
                    <Layers style={{ width: '26px', height: '26px', margin: '0 auto 8px', opacity: 0.6 }} />
                    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>No attribute dimensions defined yet</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#806957' }}>
                      Click any &ldquo;+ Dimension&rdquo; button above (e.g. <strong>+ Material Dimension</strong>, <strong>+ Color Dimension</strong>) to add options like Wooden, Steel, Red, Yellow.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {editingProduct.options.map((dim, dimIdx) => {
                      const isColor = dim.name.toLowerCase().includes('color') || dim.name.toLowerCase().includes('finish');
                      const isSize = dim.name.toLowerCase().includes('size') || dim.name.toLowerCase().includes('dimen');
                      const isMaterial = dim.name.toLowerCase().includes('mat') || dim.name.toLowerCase().includes('core');
                      const dimIcon = isSize ? '📏' : isColor ? '🎨' : isMaterial ? '🪵' : '⚙️';

                      return (
                        <div
                          key={dim.id || dimIdx}
                          style={{
                            backgroundColor: 'rgba(240,226,206,0.3)',
                            border: '1.5px solid rgba(118,89,65,0.25)',
                            borderRadius: '3px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            {/* Dimension Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(118,89,65,0.2)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <span>{dimIcon}</span>
                                <input
                                  type="text"
                                  value={dim.name}
                                  onChange={(e) => renameOptionDimension(dimIdx, e.target.value)}
                                  placeholder="Dimension Name (e.g. Material)"
                                  style={{
                                    border: 'none',
                                    borderBottom: '1px dashed rgba(118,89,65,0.4)',
                                    backgroundColor: 'transparent',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    color: '#19120C',
                                    outline: 'none',
                                    width: '100%',
                                    maxWidth: '160px'
                                  }}
                                />
                                <span style={{ fontSize: '10px', color: '#765941', fontWeight: 700, backgroundColor: 'rgba(118,89,65,0.1)', padding: '2px 6px', borderRadius: '10px' }}>
                                  {dim.values.length}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOptionDimension(dimIdx)}
                                title={`Delete ${dim.name} dimension`}
                                style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 style={{ width: '13px', height: '13px' }} />
                              </button>
                            </div>

                            {/* Current Values Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', minHeight: '32px', alignItems: 'center' }}>
                              {dim.values.length === 0 ? (
                                <span style={{ fontSize: '11px', color: '#a0856d', fontStyle: 'italic' }}>No values yet. Add below.</span>
                              ) : (
                                dim.values.map((v, valIdx) => (
                                  <span
                                    key={valIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      backgroundColor: '#fff',
                                      border: '1px solid rgba(118,89,65,0.25)',
                                      padding: '4px 8px',
                                      borderRadius: '2px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: '#19120C'
                                    }}
                                  >
                                    {v.color && (
                                      <span
                                        style={{
                                          width: '10px',
                                          height: '10px',
                                          borderRadius: '50%',
                                          backgroundColor: v.color,
                                          border: '1px solid rgba(0,0,0,0.2)',
                                          display: 'inline-block'
                                        }}
                                      />
                                    )}
                                    {v.name}
                                    <button
                                      type="button"
                                      onClick={() => removeOptionValue(dimIdx, valIdx)}
                                      title="Remove value"
                                      style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 0, fontSize: '13px', lineHeight: 1 }}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Add New Value Input Row */}
                          <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid rgba(118,89,65,0.18)', borderRadius: '2px' }}>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: (newValHasColor[dim.id] || isColor) ? '8px' : 0 }}>
                              <input
                                type="text"
                                placeholder={isColor ? 'Color Name (e.g. Terracotta Red, Natural Oak)' : isMaterial ? 'Material Name (e.g. Wooden, Steel, Aluminium)' : isSize ? 'Size (e.g. 7 ft × 3 ft)' : 'Add value...'}
                                value={newValName[dim.id] || ''}
                                onChange={(e) => setNewValName((prev) => ({ ...prev, [dim.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addOptionValue(dimIdx);
                                  }
                                }}
                                style={{ flex: 1, padding: '6px 8px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '12px', outline: 'none' }}
                              />
                              <button
                                type="button"
                                onClick={() => addOptionValue(dimIdx)}
                                style={{ padding: '6px 12px', backgroundColor: '#765941', color: '#F0E2CE', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}
                              >
                                + Add
                              </button>
                            </div>

                            {/* Optional Color Picker for Swatches */}
                            {(newValHasColor[dim.id] || isColor) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(118,89,65,0.15)', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#5b4130', fontWeight: 600 }}>
                                  <input
                                    type="checkbox"
                                    checked={newValHasColor[dim.id] !== false}
                                    onChange={(e) => setNewValHasColor((prev) => ({ ...prev, [dim.id]: e.target.checked }))}
                                  />
                                  Visual Swatch:
                                </label>
                                <input
                                  type="color"
                                  value={newValColor[dim.id] || (dim.values.length === 0 ? '#743939' : '#d31d1d')}
                                  onChange={(e) => setNewValColor((prev) => ({ ...prev, [dim.id]: e.target.value }))}
                                  style={{ width: '24px', height: '24px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                                />
                                <input
                                  type="text"
                                  value={newValColor[dim.id] || (dim.values.length === 0 ? '#743939' : '#d31d1d')}
                                  onChange={(e) => setNewValColor((prev) => ({ ...prev, [dim.id]: e.target.value }))}
                                  style={{ width: '70px', padding: '2px 4px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '10px', fontFamily: 'monospace' }}
                                />
                                <span style={{ fontSize: '10px', color: '#765941', fontStyle: 'italic' }}>
                                  (Rendered as circular luxury disc)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CARTESIAN ENGINE CALLOUT & GENERATOR BUTTON */}
                {editingProduct.options && editingProduct.options.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#19120C',
                      color: '#F0E2CE',
                      padding: '18px 24px',
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginTop: '18px'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap style={{ width: '18px', height: '18px', color: '#E5BF8C' }} />
                        Cartesian Combinations Engine
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#E5BF8C', opacity: 0.9 }}>
                        {editingProduct.options
                          .filter((o) => o.values.length > 0)
                          .map((o) => `${o.values.length} ${o.name}`)
                          .join(' × ') || '0 Dimensions'}{' '}
                        &rarr; Yields{' '}
                        <strong>
                          {editingProduct.options.filter(o => o.values.length > 0).reduce((acc, o) => acc * o.values.length, 1)} Real Variants
                        </strong>{' '}
                        with dedicated pricing & R2 photo galleries.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={generateCartesianCombinations}
                      style={{
                        padding: '11px 22px',
                        backgroundColor: '#D49E58',
                        color: '#19120C',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '2px'
                      }}
                    >
                      <Sparkles style={{ width: '16px', height: '16px' }} />
                      ⚡ Generate / Sync Combinations Matrix
                    </button>
                  </div>
                )}
              </div>

              {/* STAGE 2: VARIANT COMBINATIONS MATRIX */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#166534', backgroundColor: 'rgba(22,101,52,0.12)', padding: '3px 8px', borderRadius: '2px' }}>
                      Stage 2: Combinations Matrix ({editingProduct.variants?.length || 0} Variants Configured)
                    </span>
                  </div>

                  {/* Bulk Price Quick-Fill Bar */}
                  {editingProduct.variants && editingProduct.variants.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(240,226,206,0.5)', padding: '6px 12px', border: '1px solid rgba(118,89,65,0.25)', borderRadius: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#5b4130' }}>Bulk Price:</span>
                      <select
                        value={bulkPriceFilter}
                        onChange={(e) => setBulkPriceFilter(e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#fff', outline: 'none' }}
                      >
                        <option value="all">Apply to All Variants</option>
                        {(editingProduct.options || []).flatMap((opt) =>
                          opt.values.map((val) => (
                            <option key={`${opt.name}:::${val.name}`} value={`${opt.name}:::${val.name}`}>
                              Only {opt.name}: {val.name}
                            </option>
                          ))
                        )}
                      </select>
                      <input
                        type="text"
                        placeholder="e.g. ₹18,000"
                        value={bulkPriceAmount}
                        onChange={(e) => setBulkPriceAmount(e.target.value)}
                        style={{ width: '90px', padding: '4px 6px', fontSize: '11px', border: '1px solid rgba(118,89,65,0.3)', backgroundColor: '#fff', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={applyBulkPrice}
                        style={{ padding: '4px 10px', backgroundColor: '#166534', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderRadius: '2px' }}
                      >
                        Apply Price
                      </button>
                    </div>
                  )}
                </div>

                {(!editingProduct.variants || editingProduct.variants.length === 0) ? (
                  <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#faf8f5', border: '1px dashed rgba(118,89,65,0.3)', color: '#765941' }}>
                    <Sliders style={{ width: '28px', height: '28px', margin: '0 auto 8px', opacity: 0.6 }} />
                    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>Combinations Matrix is Empty</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#806957' }}>
                      Click the gold <strong>&ldquo;⚡ Generate / Sync Combinations Matrix&rdquo;</strong> button above to populate the combination rows!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {editingProduct.variants.map((v, vIdx) => {
                      const isPhotosOpen = !!openPhotos[v.id || String(vIdx)] || ((v.images?.length || 0) > 0);
                      const isAvail = v.is_available !== false;

                      return (
                        <div
                          key={v.id || vIdx}
                          style={{
                            backgroundColor: isAvail ? '#fff' : 'rgba(240,226,206,0.2)',
                            border: isAvail ? '1.5px solid rgba(118,89,65,0.25)' : '1px dashed rgba(185,28,28,0.3)',
                            borderRadius: '3px',
                            padding: '16px 20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            opacity: isAvail ? 1 : 0.75
                          }}
                        >
                          {/* Top Row: Combination Title, Option Badges, Status Toggle */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#19120C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {v.color && (
                                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: v.color, border: '1px solid rgba(0,0,0,0.25)', display: 'inline-block' }} />
                                )}
                                {v.name || v.title || `Variant ${vIdx + 1}`}
                              </span>

                              {/* Attributes Breakdown Badges */}
                              {v.options &&
                                Object.entries(v.options).map(([optName, optVal]) => (
                                  <span
                                    key={optName}
                                    style={{
                                      fontSize: '11px',
                                      backgroundColor: 'rgba(118,89,65,0.08)',
                                      color: '#765941',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontWeight: 600
                                    }}
                                  >
                                    {optName}: <strong>{optVal}</strong>
                                  </span>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* In Stock / Available Toggle */}
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: isAvail ? '#166534' : '#991b1b', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isAvail}
                                  onChange={(e) => updateVariantRow(vIdx, { is_available: e.target.checked })}
                                />
                                {isAvail ? 'Available' : 'Unavailable (Disabled)'}
                              </label>

                              {/* Delete single combination */}
                              <button
                                type="button"
                                onClick={() => removeVariantRow(vIdx)}
                                title="Delete this combination"
                                style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 style={{ width: '14px', height: '14px' }} />
                              </button>
                            </div>
                          </div>

                          {/* Inputs: Price, SKU, Photos Button */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(140px, 1.3fr) minmax(130px, 1.2fr) auto',
                              gap: '14px',
                              alignItems: 'center'
                            }}
                          >
                            {/* Price */}
                            <div>
                              <label style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                                Combination Price *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. ₹12,000 or ₹18,500"
                                value={v.price}
                                onChange={(e) => updateVariantRow(vIdx, { price: e.target.value })}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '8px 12px',
                                  border: '1.5px solid rgba(22,101,52,0.4)',
                                  backgroundColor: '#f0fdf4',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#166534',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* SKU */}
                            <div>
                              <label style={{ display: 'block', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#765941', marginBottom: '4px' }}>
                                SKU Code
                              </label>
                              <input
                                type="text"
                                placeholder="ROEL/WL-01-WD-RD"
                                value={v.sku}
                                onChange={(e) => updateVariantRow(vIdx, { sku: e.target.value })}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '8px 12px',
                                  border: '1px solid rgba(118,89,65,0.25)',
                                  backgroundColor: '#faf8f5',
                                  fontSize: '12px',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Photos Button */}
                            <div style={{ paddingTop: '16px' }}>
                              <button
                                type="button"
                                onClick={() => togglePhotos(v.id || String(vIdx))}
                                style={{
                                  padding: '8px 14px',
                                  backgroundColor: (v.images && v.images.length > 0) ? '#19120C' : 'rgba(118,89,65,0.12)',
                                  color: (v.images && v.images.length > 0) ? '#F0E2CE' : '#765941',
                                  border: 'none',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Camera style={{ width: '13px', height: '13px' }} />
                                Photos ({v.images?.length || 0})
                              </button>
                            </div>
                          </div>

                          {/* Dedicated Cloudflare R2 Dropzone for this combination */}
                          {isPhotosOpen && (
                            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(118,89,65,0.15)' }}>
                              <ImageDropzone
                                multiple
                                folder={`variants/${(v.sku || 'v').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                value={v.images}
                                onChange={(imgs) => updateVariantRow(vIdx, { images: imgs })}
                                label={`Cloudflare R2 Photos for "${v.name}" (${v.images?.length || 0})`}
                                hint="Photos specific to this exact combination (e.g. Wooden in Red color). Uploads to Cloudflare R2."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Card */}
            <div style={{ backgroundColor: '#fff', padding: '28px', border: '1px solid rgba(118,89,65,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: 0, color: '#19120C' }}>
                  3. Architectural Specifications
                </h3>
                <button
                  type="button"
                  onClick={addSpec}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(118,89,65,0.15)',
                    color: '#765941',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus style={{ width: '13px', height: '13px' }} />
                  Add Spec
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(editingProduct.specs || []).map((spec, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#765941', fontWeight: 700, width: '20px' }}>
                      {sIdx + 1}.
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Natural wood-look finish"
                      value={spec}
                      onChange={(e) => updateSpec(sIdx, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid rgba(118,89,65,0.25)',
                        backgroundColor: '#F0E2CE',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(sIdx)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Media, Status & Visibility */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Primary Image Upload Card */}
            <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid rgba(118,89,65,0.2)' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '18px', margin: '0 0 16px', color: '#19120C' }}>
                Primary Thumbnail Image
              </h3>
              <ImageDropzone
                multiple={false}
                folder="products"
                value={editingProduct.image || ''}
                onChange={(url) => setEditingProduct({ ...editingProduct, image: url })}
                label="Product Main Photo"
                hint="Used as catalogue card thumbnail and default display."
              />
            </div>

            {/* General Product Gallery Card */}
            <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid rgba(118,89,65,0.2)' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '18px', margin: '0 0 16px', color: '#19120C' }}>
                Overall Lifestyle & Installation Gallery
              </h3>
              <ImageDropzone
                multiple
                folder="products"
                value={editingProduct.gallery || []}
                onChange={(urls) => setEditingProduct({ ...editingProduct, gallery: urls })}
                label="Additional Gallery Photos"
                hint="Drop in situ shots, close-up textures or project installs."
              />
            </div>

            {/* Visibility & Status Card */}
            <div style={{ backgroundColor: '#fff', padding: '24px', border: '1px solid rgba(118,89,65,0.2)' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '18px', margin: '0 0 16px', color: '#19120C' }}>
                Publishing & Homepage Status
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#5b4130', marginBottom: '6px' }}>
                  Publication Status
                </label>
                <select
                  value={editingProduct.status || 'published'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', backgroundColor: '#F0E2CE', fontSize: '13px', outline: 'none' }}
                >
                  <option value="published">Published (Visible to Visitors)</option>
                  <option value="draft">Draft (Hidden in Public Catalogue)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(118,89,65,0.15)' }}>
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={!!editingProduct.is_featured}
                  onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="featuredToggle" style={{ fontSize: '13px', fontWeight: 600, color: '#19120C', cursor: 'pointer' }}>
                  Feature in Homepage Showcase
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW: PRODUCTS LIST
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Control Bar: Search, Category Filter, and Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          backgroundColor: '#fff',
          padding: '18px 24px',
          border: '1px solid rgba(118,89,65,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#765941'
              }}
            />
            <input
              type="text"
              placeholder="Search products by title, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px 9px 36px',
                border: '1px solid rgba(118,89,65,0.25)',
                fontSize: '13px',
                backgroundColor: '#F0E2CE',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid rgba(118,89,65,0.25)',
              backgroundColor: '#fff',
              fontSize: '12px',
              color: '#19120C',
              outline: 'none'
            }}
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchData}
            title="Refresh product list"
            style={{
              padding: '9px 14px',
              border: '1px solid rgba(118,89,65,0.25)',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#765941'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
          <button
            onClick={handleStartCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', color: '#D49E58' }} />
            Add Architectural Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#765941' }}>
            <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading catalog from Supabase...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#806957' }}>
            <p style={{ fontSize: '15px', margin: '0 0 8px', fontWeight: 600 }}>No products found</p>
            <button
              onClick={handleStartCreate}
              style={{
                marginTop: '10px',
                padding: '9px 16px',
                backgroundColor: '#765941',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(240,226,206,0.5)', borderBottom: '1px solid rgba(118,89,65,0.2)' }}>
                <th style={{ padding: '14px 18px', width: '70px' }}>Thumbnail</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Product Title & SKU
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Category
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Price
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Variants
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Featured
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid rgba(118,89,65,0.1)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(215,182,145,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 18px' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        backgroundColor: '#19120C',
                        overflow: 'hidden',
                        borderRadius: '2px',
                        border: '1px solid rgba(118,89,65,0.2)'
                      }}
                    >
                      <img
                        src={p.image || '/images/slat.webp'}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/slat.webp';
                        }}
                      />
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: '#19120C', fontSize: '14px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#765941', fontFamily: 'monospace', marginTop: '2px' }}>
                      {p.sku}
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(118,89,65,0.1)',
                        color: '#765941',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '2px'
                      }}
                    >
                      {p.category}
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#19120C' }}>
                    {p.price || '—'}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        backgroundColor: (p.variants && p.variants.length > 0) ? '#dcfce7' : '#f3f4f6',
                        color: (p.variants && p.variants.length > 0) ? '#166534' : '#6b7280',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '2px'
                      }}
                    >
                      <Layers style={{ width: '12px', height: '12px' }} />
                      {p.variants?.length || 0} Variants
                    </span>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(p)}
                      title={p.is_featured ? 'Featured on home' : 'Click to feature on home'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: p.is_featured ? '#d97706' : '#d1d5db',
                        display: 'grid',
                        placeItems: 'center',
                        padding: '4px'
                      }}
                    >
                      <Star style={{ width: '18px', height: '18px', fill: p.is_featured ? '#d97706' : 'none' }} />
                    </button>
                  </td>

                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <a
                        href={`/product/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View Live on Website"
                        style={{
                          padding: '6px',
                          border: '1px solid rgba(118,89,65,0.25)',
                          color: '#765941',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicate Product"
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: '1px solid rgba(118,89,65,0.25)',
                          color: '#765941',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        title="Edit Product"
                        style={{
                          padding: '6px',
                          backgroundColor: '#19120C',
                          border: 'none',
                          color: '#F0E2CE',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        title="Delete Product"
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: '1px solid rgba(185,28,28,0.25)',
                          color: '#b91c1c',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
