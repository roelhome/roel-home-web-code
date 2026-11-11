import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Check, X, Tag, Loader2, RefreshCw } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order_index: number;
  product_count?: number;
}

export const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);

  // New Category State
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState<number>(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (catError) throw catError;

      // 2. Fetch product counts for each category
      const { data: prodData } = await supabase.from('products').select('category_id');

      const countMap: Record<string, number> = {};
      prodData?.forEach((p) => {
        if (p.category_id) {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        }
      });

      const enriched = (catData || []).map((c) => ({
        ...c,
        product_count: countMap[c.id] || 0
      }));

      setCategories(enriched);
      setNewOrder(enriched.length + 1);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);

    const slug = newName.trim();

    try {
      const { error: insertError } = await supabase.from('categories').insert([
        {
          id: slug,
          name: newName.trim(),
          order_index: newOrder
        }
      ]);

      if (insertError) throw insertError;

      setNewName('');
      await fetchCategories();
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditOrder(cat.order_index);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: editName.trim(),
          order_index: editOrder
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setEditingId(null);
      await fetchCategories();
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.product_count && cat.product_count > 0) {
      const proceed = window.confirm(
        `This category currently has ${cat.product_count} product(s) assigned. Deleting it will unlink those products. Are you sure?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    }

    try {
      const { error: delError } = await supabase.from('categories').delete().eq('id', cat.id);
      if (delError) throw delError;

      await fetchCategories();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err?.message || 'Failed to delete category');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Create New Category Card */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px 28px',
          border: '1px solid rgba(118,89,65,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Tag style={{ width: '16px', height: '16px', color: '#765941' }} />
          <h2
            style={{
              fontFamily: 'RoelSerif, Georgia, serif',
              fontSize: '22px',
              margin: 0,
              color: '#19120C'
            }}
          >
            Create Product Category
          </h2>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '12px'
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px auto',
            gap: '12px',
            alignItems: 'end'
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: '#5b4130',
                marginBottom: '6px'
              }}
            >
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acoustic Slats, Fluted Glass Doors..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                border: '1px solid rgba(118,89,65,0.25)',
                fontSize: '13px',
                backgroundColor: '#F0E2CE',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: '#5b4130',
                marginBottom: '6px'
              }}
            >
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                border: '1px solid rgba(118,89,65,0.25)',
                fontSize: '13px',
                backgroundColor: '#F0E2CE',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            style={{
              padding: '11px 20px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: creating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '40px'
            }}
          >
            {creating ? (
              <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Plus style={{ width: '14px', height: '14px' }} />
            )}
            Add Category
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)' }}>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(118,89,65,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#19120C' }}>
            Current Categories ({categories.length})
          </div>
          <button
            onClick={fetchCategories}
            title="Refresh"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#765941',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#765941' }}>
            <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <span style={{ fontSize: '12px' }}>Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#806957', fontSize: '13px' }}>
            No categories defined yet. Add your first category above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(240,226,206,0.5)', borderBottom: '1px solid rgba(118,89,65,0.2)' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130', width: '90px' }}>
                  Order
                </th>
                <th style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Category Name
                </th>
                <th style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130', width: '140px' }}>
                  Active Products
                </th>
                <th style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130', textAlign: 'right', width: '120px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(118,89,65,0.1)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#765941' }}>
                    {editingId === cat.id ? (
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: '60px',
                          padding: '4px 6px',
                          border: '1px solid rgba(118,89,65,0.3)',
                          fontSize: '12px'
                        }}
                      />
                    ) : (
                      `#${cat.order_index}`
                    )}
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          padding: '5px 8px',
                          border: '1px solid rgba(118,89,65,0.3)',
                          fontSize: '13px'
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: '#19120C' }}>{cat.name}</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(118,89,65,0.1)',
                        color: '#765941',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '2px'
                      }}
                    >
                      {cat.product_count} {cat.product_count === 1 ? 'Product' : 'Products'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {editingId === cat.id ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => saveEdit(cat.id)}
                          title="Save Changes"
                          style={{
                            padding: '6px',
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Check style={{ width: '13px', height: '13px' }} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          title="Cancel"
                          style={{
                            padding: '6px',
                            background: '#765941',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <X style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          title="Edit Category"
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(118,89,65,0.25)',
                            color: '#765941',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 style={{ width: '13px', height: '13px' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(185,28,28,0.25)',
                            color: '#b91c1c',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    )}
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
