import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageDropzone } from './ImageDropzone';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Loader2,
  Briefcase,
  Eye,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export interface ServiceStepItem {
  title: string;
  description: string;
}

export interface AdminService {
  id: string;
  number: string;
  name: string;
  tag: string;
  summary: string;
  description: string;
  image_url: string;
  items: ServiceStepItem[];
  order_index: number;
}

const TAG_PRESETS = [
  'Discover the right fit',
  'Every detail considered',
  'From selection to site',
  'Acoustic & Surface Consultation',
  'Architectural Woodcraft',
  'Full Turnkey Coordination'
];

const DEFAULT_TITLES = ['Understand', 'Explore', 'Refine', 'Plan', 'Coordinate', 'Deliver', 'Execute'];

const DEFAULT_STEPS: ServiceStepItem[] = [
  { title: 'Understand', description: 'Understand your space, aesthetic and priorities' },
  { title: 'Explore', description: 'Review suitable products, textures and finishes' },
  { title: 'Refine', description: 'Discuss budget ranges and practical considerations' },
  { title: 'Plan', description: 'Prepare a clear shortlist for your project' }
];

export const normalizeStep = (step: any, index: number): ServiceStepItem => {
  if (typeof step === 'object' && step !== null) {
    return {
      title: step.title || step.heading || DEFAULT_TITLES[index] || `Step 0${index + 1}`,
      description: step.description || step.text || ''
    };
  }
  return {
    title: DEFAULT_TITLES[index] || `Step 0${index + 1}`,
    description: typeof step === 'string' ? step : ''
  };
};

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all services from Supabase
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });

      if (fetchErr) throw fetchErr;

      setServices(
        (data || []).map((d: any) => ({
          id: d.id,
          number: d.number || '01',
          name: d.name || '',
          tag: d.tag || '',
          summary: d.summary || '',
          description: d.description || '',
          image_url: d.image_url || '/images/living.webp',
          items: Array.isArray(d.items) ? d.items.map(normalizeStep) : [],
          order_index: d.order_index ?? 1
        }))
      );
    } catch (err: any) {
      console.error('Fetch services error:', err);
      setError(err?.message || 'Failed to load services from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services by search term
  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const term = search.toLowerCase();
    return services.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.number.toLowerCase().includes(term) ||
        s.tag.toLowerCase().includes(term) ||
        s.summary.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.items.some((step) =>
          step.title.toLowerCase().includes(term) ||
          step.description.toLowerCase().includes(term)
        )
      );
    });
  }, [services, search]);

  // Slugify helper for generating URL friendly service IDs
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Open modal for creating a new service
  const handleCreateNew = () => {
    const nextOrder = services.length > 0 ? Math.max(...services.map((s) => s.order_index || 0)) + 1 : 1;
    const nextNum = String(services.length + 1).padStart(2, '0');

    setEditingService({
      id: '',
      number: nextNum,
      name: '',
      tag: 'Discover the right fit',
      summary: '',
      description: '',
      image_url: '/images/living.webp',
      items: DEFAULT_STEPS.map((s) => ({ ...s })),
      order_index: nextOrder
    });
    setIsNew(true);
    setError(null);
  };

  // Open modal for editing existing service
  const handleEdit = (service: AdminService) => {
    setEditingService({
      ...service,
      items: (service.items || []).map((s, idx) => normalizeStep(s, idx))
    });
    setIsNew(false);
    setError(null);
  };

  // Duplicate an existing service
  const handleDuplicate = async (service: AdminService) => {
    const newId = `${service.id}-copy-${Date.now().toString(36).substring(4, 7)}`;
    const nextNum = String(services.length + 1).padStart(2, '0');
    const newService = {
      ...service,
      id: newId,
      number: nextNum,
      name: `${service.name} (Copy)`,
      order_index: (service.order_index || 0) + 1,
      items: (service.items || []).map((s, idx) => normalizeStep(s, idx))
    };

    setSaving(true);
    setError(null);
    try {
      const { error: insErr } = await supabase.from('services').insert([newService]);
      if (insErr) throw insErr;

      setSuccessMessage(`Duplicated "${service.name}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchServices();
    } catch (err: any) {
      console.error('Duplicate service error:', err);
      setError(err?.message || 'Failed to duplicate service');
    } finally {
      setSaving(false);
    }
  };

  // Delete service
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete service "${name}" (${id})? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('services').delete().eq('id', id);
      if (delErr) throw delErr;

      setSuccessMessage(`Deleted service "${name}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchServices();
    } catch (err: any) {
      console.error('Delete service error:', err);
      setError(err?.message || 'Failed to delete service');
    } finally {
      setSaving(false);
    }
  };

  // Step item handlers inside editor modal
  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    if (!editingService) return;
    const newSteps = [...editingService.items];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setEditingService({ ...editingService, items: newSteps });
  };

  const handleAddStep = () => {
    if (!editingService) return;
    const nextIdx = editingService.items.length;
    setEditingService({
      ...editingService,
      items: [
        ...editingService.items,
        {
          title: DEFAULT_TITLES[nextIdx] || `Step 0${nextIdx + 1}`,
          description: ''
        }
      ]
    });
  };

  const handleRemoveStep = (index: number) => {
    if (!editingService) return;
    const newSteps = editingService.items.filter((_, i) => i !== index);
    setEditingService({ ...editingService, items: newSteps });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!editingService) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingService.items.length) return;

    const newSteps = [...editingService.items];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    setEditingService({ ...editingService, items: newSteps });
  };

  // Save service (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const cleanName = editingService.name.trim();
    if (!cleanName) {
      setError('Service Name is required.');
      return;
    }

    let cleanId = editingService.id.trim();
    if (!cleanId) {
      cleanId = slugify(cleanName);
    }

    if (!cleanId) {
      setError('Valid Service ID / Slug is required.');
      return;
    }

    if (!editingService.image_url) {
      setError('Please provide a Cover Photo.');
      return;
    }

    // Filter out completely empty steps (where both title and description are blank)
    const cleanItems = (editingService.items || [])
      .map((item, idx) => ({
        title: item.title?.trim() || DEFAULT_TITLES[idx] || `Step 0${idx + 1}`,
        description: item.description?.trim() || ''
      }))
      .filter((item) => item.title !== '' || item.description !== '');

    setSaving(true);
    setError(null);

    const payload = {
      id: cleanId,
      number: editingService.number.trim() || '01',
      name: cleanName,
      tag: editingService.tag.trim() || 'Discover the right fit',
      summary: editingService.summary.trim(),
      description: editingService.description.trim(),
      image_url: editingService.image_url.trim(),
      items: cleanItems,
      order_index: Number(editingService.order_index) || 1
    };

    try {
      if (isNew) {
        // Check if ID already exists
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('id', cleanId)
          .maybeSingle();

        if (existing) {
          throw new Error(`A service with slug "${cleanId}" already exists. Please choose a unique slug.`);
        }

        const { error: insertErr } = await supabase.from('services').insert([payload]);
        if (insertErr) throw insertErr;
      } else {
        const { error: updateErr } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id);

        if (updateErr) throw updateErr;
      }

      setSuccessMessage(`Saved service "${cleanName}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingService(null);
      await fetchServices();
    } catch (err: any) {
      console.error('Save service error:', err);
      setError(err?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontFamily: 'RoelSerif, Georgia, serif',
                fontSize: '32px',
                fontWeight: 400,
                margin: 0,
                color: '#19120C'
              }}
            >
              Services & Practice
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(118,89,65,0.12)',
                color: '#765941',
                padding: '4px 10px',
                borderRadius: '12px'
              }}
            >
              {services.length} Services
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#765941' }}>
            Manage consultation, design detailing, and supply workflow services displayed on{' '}
            <a href="/services" target="_blank" style={{ color: '#19120C', fontWeight: 600 }}>
              roelhomes.com/services ↗
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchServices}
            title="Refresh services list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#fff',
              border: '1px solid rgba(118,89,65,0.25)',
              borderRadius: '2px',
              color: '#765941',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw
              style={{
                width: '14px',
                height: '14px',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: '1px solid #19120C',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(25,18,12,0.15)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px', color: '#E5BF8C' }} />
            + New Service
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '2px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '2px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <Check style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '14px 18px',
          borderRadius: '2px',
          border: '1px solid rgba(118,89,65,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#a0856d'
            }}
          />
          <input
            type="text"
            placeholder="Search services by name, number, tag, description, or step headings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118,89,65,0.25)',
              borderRadius: '2px',
              fontSize: '12.5px',
              color: '#19120C',
              outline: 'none'
            }}
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#765941',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#765941' }}>
          <Loader2
            style={{
              width: '36px',
              height: '36px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
              color: '#D49E58'
            }}
          />
          <p style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Loading Services & Practice...
          </p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1.5px dashed rgba(118,89,65,0.3)',
            borderRadius: '2px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#765941'
          }}
        >
          <Briefcase style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 8px', color: '#19120C' }}>No services found</h3>
          <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px' }}>
            {search
              ? 'No services match your search criteria.'
              : 'You have not added any architectural services yet.'}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Create First Service
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredServices.map((s) => {
            return (
              <div
                key={s.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(118,89,65,0.22)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(25,18,12,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Service Showcase Image */}
                <div style={{ position: 'relative', height: '200px', backgroundColor: '#9a7153', overflow: 'hidden' }}>
                  <img
                    src={s.image_url}
                    alt={s.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/living.webp';
                    }}
                  />
                  {/* Service Number Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(25,18,12,0.92)',
                      color: '#E5BF8C',
                      padding: '4px 9px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      borderRadius: '2px',
                      backdropFilter: 'blur(4px)',
                      fontFamily: 'monospace'
                    }}
                  >
                    #{s.number}
                  </div>

                  {/* Service Tag Badge */}
                  {s.tag && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(25,18,12,0.85)',
                        color: '#F0E2CE',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        borderRadius: '2px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {s.tag}
                    </div>
                  )}

                  {/* Order Index Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      backgroundColor: 'rgba(25,18,12,0.75)',
                      color: '#FAF7F2',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '2px'
                    }}
                  >
                    Order #{s.order_index}
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h3
                      style={{
                        fontFamily: 'RoelSerif, Georgia, serif',
                        fontSize: '20px',
                        fontWeight: 400,
                        margin: 0,
                        color: '#19120C'
                      }}
                    >
                      {s.name}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#765941',
                      fontFamily: 'monospace',
                      marginBottom: '12px'
                    }}
                  >
                    <span>/service/{s.id}</span>
                  </div>

                  <p
                    style={{
                      fontSize: '12.5px',
                      lineHeight: '1.6',
                      color: '#5b4130',
                      margin: '0 0 14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {s.summary || s.description}
                  </p>

                  {/* Workflow Steps Preview with Headings */}
                  <div
                    style={{
                      marginTop: 'auto',
                      marginBottom: '16px',
                      padding: '10px 12px',
                      backgroundColor: '#FAF7F2',
                      border: '1px solid rgba(118,89,65,0.15)',
                      borderRadius: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#765941' }}>
                        Process Steps ({s.items?.length || 0})
                      </span>
                    </div>
                    {s.items && s.items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {s.items.slice(0, 2).map((step, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '11.5px',
                              color: '#5b4130',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            <strong style={{ color: '#D49E58', marginRight: '5px' }}>0{idx + 1}</strong>
                            <strong style={{ color: '#19120C', marginRight: '6px' }}>{step.title}:</strong>
                            <span>{step.description}</span>
                          </div>
                        ))}
                        {s.items.length > 2 && (
                          <span style={{ fontSize: '10.5px', color: '#a0856d', fontStyle: 'italic', marginTop: '2px' }}>
                            + {s.items.length - 2} more steps
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#a0856d', fontStyle: 'italic' }}>
                        No steps defined yet
                      </span>
                    )}
                  </div>

                  {/* Action Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      borderTop: '1px solid rgba(118,89,65,0.15)'
                    }}
                  >
                    <a
                      href={`/service/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live user page"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        color: '#765941',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      View Live ↗
                    </a>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(s)}
                        title="Duplicate this service"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#765941',
                          padding: '6px'
                        }}
                      >
                        <Copy style={{ width: '15px', height: '15px' }} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(s)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#FAF7F2',
                          border: '1px solid rgba(118,89,65,0.3)',
                          borderRadius: '2px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#19120C',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 style={{ width: '13px', height: '13px' }} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        title="Delete service"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#dc2626',
                          padding: '6px'
                        }}
                      >
                        <Trash2 style={{ width: '15px', height: '15px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SERVICE EDITOR MODAL (Slide-Over / Full Form) */}
      {/* ========================================================================= */}
      {editingService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(25,18,12,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '3px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid rgba(118,89,65,0.3)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(118,89,65,0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FAF7F2'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#765941'
                  }}
                >
                  {isNew ? 'Create New Entry' : 'Edit Service Offering'}
                </span>
                <h2
                  style={{
                    fontFamily: 'RoelSerif, Georgia, serif',
                    fontSize: '22px',
                    margin: '2px 0 0',
                    color: '#19120C'
                  }}
                >
                  {isNew ? 'New Architectural Service' : editingService.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingService(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#765941',
                  padding: '6px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              {/* Row 1: Name and Slug */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#765941',
                      marginBottom: '6px'
                    }}
                  >
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Material Consultation"
                    value={editingService.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setEditingService((prev) => {
                        if (!prev) return null;
                        const autoSlug = isNew ? slugify(newName) : prev.id;
                        return { ...prev, name: newName, id: autoSlug };
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#765941',
                      marginBottom: '6px'
                    }}
                  >
                    URL Slug / ID * (roelhomes.com/service/
                    <strong style={{ color: '#19120C' }}>{editingService.id || 'slug'}</strong>)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNew}
                    placeholder="e.g. material-consultation"
                    value={editingService.id}
                    onChange={(e) =>
                      setEditingService((prev) =>
                        prev ? { ...prev, id: slugify(e.target.value) } : null
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      backgroundColor: isNew ? '#FAF7F2' : 'rgba(0,0,0,0.04)',
                      cursor: isNew ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Number, Tag, Order Index */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '18px',
                  marginBottom: '20px'
                }}
              >
                {/* Number */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#765941',
                      marginBottom: '6px'
                    }}
                  >
                    Service Number (#) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01, 02, 04"
                    value={editingService.number}
                    onChange={(e) =>
                      setEditingService((prev) => (prev ? { ...prev, number: e.target.value } : null))
                    }
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>

                {/* Eyebrow Tag */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#765941',
                      marginBottom: '6px'
                    }}
                  >
                    Eyebrow Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discover the right fit"
                    value={editingService.tag}
                    onChange={(e) =>
                      setEditingService((prev) => (prev ? { ...prev, tag: e.target.value } : null))
                    }
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2',
                      marginBottom: '6px'
                    }}
                  />
                  {/* Preset Quick Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {TAG_PRESETS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setEditingService((prev) => (prev ? { ...prev, tag: tag } : null))
                        }
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor:
                            editingService.tag === tag ? '#19120C' : 'rgba(118,89,65,0.1)',
                          color: editingService.tag === tag ? '#F0E2CE' : '#765941',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Index */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#765941',
                      marginBottom: '6px'
                    }}
                  >
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingService.order_index}
                    onChange={(e) =>
                      setEditingService((prev) =>
                        prev ? { ...prev, order_index: parseInt(e.target.value) || 1 } : null
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid rgba(118,89,65,0.25)',
                      borderRadius: '2px',
                      fontSize: '12.5px',
                      outline: 'none',
                      backgroundColor: '#FAF7F2'
                    }}
                  />
                </div>
              </div>

              {/* Cover Photo via Dropzone */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#765941',
                    marginBottom: '6px'
                  }}
                >
                  Service Feature Photo (Cloudflare R2 or URL) *
                </label>
                <ImageDropzone
                  value={editingService.image_url}
                  onChange={(url) =>
                    setEditingService((prev) => (prev ? { ...prev, image_url: url } : null))
                  }
                  folder="services"
                  hint="Drag & drop service photo or click to upload directly to Cloudflare R2 bucket (folder: services)"
                />
              </div>

              {/* Summary */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#765941',
                    marginBottom: '6px'
                  }}
                >
                  Short Summary (1-2 sentences shown on service overview & cards)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Guidance on choosing surfaces, doors and finishes that feel right for your space."
                  value={editingService.summary}
                  onChange={(e) =>
                    setEditingService((prev) => (prev ? { ...prev, summary: e.target.value } : null))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '2px',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                    outline: 'none',
                    backgroundColor: '#FAF7F2',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Full Description */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#765941',
                    marginBottom: '6px'
                  }}
                >
                  Full Description (Shown on /service/{editingService.id || 'slug'})
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide in-depth architectural narrative, methodology, or advisory scope..."
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '2px',
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    outline: 'none',
                    backgroundColor: '#FAF7F2',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Process & Workflow Steps Builder with Headings + Descriptions */}
              <div
                style={{
                  marginBottom: '28px',
                  padding: '20px',
                  backgroundColor: '#FAF7F2',
                  border: '1px solid rgba(118,89,65,0.2)',
                  borderRadius: '2px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#765941',
                        display: 'block'
                      }}
                    >
                      Process & Consultation Steps ({editingService.items.length})
                    </span>
                    <span style={{ fontSize: '12px', color: '#806957' }}>
                      Edit both the <strong>heading</strong> (e.g. Understand, Explore, Refine) and the <strong>description</strong> for each step.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStep}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      backgroundColor: '#19120C',
                      color: '#F0E2CE',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '13px', height: '13px', color: '#D49E58' }} />
                    + Add Step
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {editingService.items.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        backgroundColor: '#fff',
                        padding: '12px 14px',
                        border: '1px solid rgba(118,89,65,0.22)',
                        borderRadius: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Step Header: Badge + Move/Delete Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#D49E58',
                            fontFamily: 'monospace',
                            letterSpacing: '0.08em'
                          }}
                        >
                          STEP 0{idx + 1}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStep(idx, 'up')}
                            title="Move step up"
                            style={{
                              background: '#FAF7F2',
                              border: '1px solid rgba(118,89,65,0.2)',
                              borderRadius: '2px',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              opacity: idx === 0 ? 0.3 : 1,
                              padding: '3px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#765941'
                            }}
                          >
                            <ArrowUp style={{ width: '13px', height: '13px' }} />
                          </button>

                          <button
                            type="button"
                            disabled={idx === editingService.items.length - 1}
                            onClick={() => handleMoveStep(idx, 'down')}
                            title="Move step down"
                            style={{
                              background: '#FAF7F2',
                              border: '1px solid rgba(118,89,65,0.2)',
                              borderRadius: '2px',
                              cursor: idx === editingService.items.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: idx === editingService.items.length - 1 ? 0.3 : 1,
                              padding: '3px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#765941'
                            }}
                          >
                            <ArrowDown style={{ width: '13px', height: '13px' }} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            title="Remove this step"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#dc2626',
                              marginLeft: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>

                      {/* Inputs: Step Heading and Step Description */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(180px, 240px) 1fr',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: '#765941',
                              marginBottom: '4px',
                              letterSpacing: '0.06em'
                            }}
                          >
                            Step Heading *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Understand"
                            value={step.title}
                            onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid rgba(118,89,65,0.25)',
                              borderRadius: '2px',
                              fontSize: '13px',
                              fontWeight: 600,
                              outline: 'none',
                              backgroundColor: '#FAF7F2',
                              color: '#19120C'
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: '#765941',
                              marginBottom: '4px',
                              letterSpacing: '0.06em'
                            }}
                          >
                            Step Description *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Understand your space, aesthetic and priorities"
                            value={step.description}
                            onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid rgba(118,89,65,0.25)',
                              borderRadius: '2px',
                              fontSize: '12.5px',
                              outline: 'none',
                              backgroundColor: '#FAF7F2',
                              color: '#19120C'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {editingService.items.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#806957', fontSize: '12px' }}>
                      No process steps added yet. Click "+ Add Step" to define the consultation workflow.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(118,89,65,0.18)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#FAF7F2',
                    border: '1px solid rgba(118,89,65,0.25)',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#765941',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    backgroundColor: '#19120C',
                    color: '#F0E2CE',
                    border: '1px solid #19120C',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(25,18,12,0.15)'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2
                        style={{
                          width: '14px',
                          height: '14px',
                          animation: 'spin 1s linear infinite',
                          color: '#D49E58'
                        }}
                      />
                      Saving Service...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: '14px', height: '14px', color: '#E5BF8C' }} />
                      {isNew ? 'Create Service' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
