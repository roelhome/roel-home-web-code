import React, { useState, useEffect } from 'react';
import {
  getPopupSettings,
  updatePopupSettings,
  defaultPopupSettings,
  type PopupSettings,
  type PopupFormField
} from '../../lib/supabase';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  MessageSquare,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  HelpCircle,
  X,
  ExternalLink,
  Layers,
  Clock,
  FileText
} from 'lucide-react';

export const PopupManager: React.FC = () => {
  const [settings, setSettings] = useState<PopupSettings>(defaultPopupSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active section tab in the manager
  const [activeSection, setActiveSection] = useState<'fields' | 'triggers' | 'content' | 'contact'>('fields');
  
  // Preview device mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Field Modal State (for adding or editing a field)
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldFormData, setFieldFormData] = useState<Partial<PopupFormField>>({
    label: '',
    name: '',
    type: 'text',
    placeholder: '',
    required: false,
    enabled: true,
    options: ['Option 1', 'Option 2', 'Option 3']
  });
  const [newOptionInput, setNewOptionInput] = useState('');

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPopupSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading popup settings:', err);
      setError('Could not load popup settings. Using default configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await updatePopupSettings(settings);
      if (res.success) {
        setSuccessMessage('Pop-up configuration saved successfully to Supabase!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error('Error saving popup settings:', err);
      setError(err.message || 'Failed to save settings to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all pop-up form settings to original ROEL factory defaults? Any custom input fields will be removed.')) {
      setSettings(defaultPopupSettings);
      setSuccessMessage('Form reset to defaults. Click "Save Changes" to publish to live site.');
    }
  };

  // Field Reordering
  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...settings.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    // re-assign order_index
    const ordered = newFields.map((f, i) => ({ ...f, order_index: i + 1 }));
    setSettings({ ...settings, fields: ordered });
  };

  // Toggle Field Enabled / Disabled
  const toggleFieldEnabled = (fieldId: string) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, enabled: !f.enabled } : f))
    }));
  };

  // Toggle Field Required
  const toggleFieldRequired = (fieldId: string) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f))
    }));
  };

  // Delete Custom Field
  const deleteField = (fieldId: string) => {
    const field = settings.fields.find((f) => f.id === fieldId);
    if (!field) return;

    if (field.is_system) {
      alert('System fields (like Name or Phone) cannot be deleted. You can disable them instead.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the field "${field.label}"?`)) {
      const filtered = settings.fields.filter((f) => f.id !== fieldId);
      const reordered = filtered.map((f, i) => ({ ...f, order_index: i + 1 }));
      setSettings({ ...settings, fields: reordered });
    }
  };

  // Open modal to add a new field
  const handleOpenAddField = () => {
    setEditingFieldId(null);
    setFieldFormData({
      label: '',
      name: '',
      type: 'text',
      placeholder: '',
      required: false,
      enabled: true,
      options: ['Option 1', 'Option 2']
    });
    setNewOptionInput('');
    setIsFieldModalOpen(true);
  };

  // Open modal to edit existing field
  const handleOpenEditField = (field: PopupFormField) => {
    setEditingFieldId(field.id);
    setFieldFormData({
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder || '',
      required: field.required,
      enabled: field.enabled,
      options: field.options ? [...field.options] : ['Option 1', 'Option 2']
    });
    setNewOptionInput('');
    setIsFieldModalOpen(true);
  };

  // Save Field Modal changes
  const handleSaveFieldModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fieldFormData.label?.trim()) {
      alert('Please enter a field label.');
      return;
    }

    // Auto-generate name if empty
    const slugName = (fieldFormData.name?.trim() || fieldFormData.label.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');

    if (editingFieldId) {
      // Editing existing field
      setSettings((prev) => ({
        ...prev,
        fields: prev.fields.map((f) => {
          if (f.id === editingFieldId) {
            return {
              ...f,
              label: fieldFormData.label!.trim(),
              name: f.is_system ? f.name : slugName,
              type: fieldFormData.type || 'text',
              placeholder: fieldFormData.placeholder?.trim() || '',
              required: !!fieldFormData.required,
              enabled: !!fieldFormData.enabled,
              options: fieldFormData.type === 'select' ? (fieldFormData.options || []) : undefined
            };
          }
          return f;
        })
      }));
    } else {
      // Creating new field
      const newField: PopupFormField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: slugName || `field_${Date.now()}`,
        label: fieldFormData.label.trim(),
        type: fieldFormData.type || 'text',
        placeholder: fieldFormData.placeholder?.trim() || '',
        required: !!fieldFormData.required,
        enabled: fieldFormData.enabled !== false,
        options: fieldFormData.type === 'select' ? (fieldFormData.options || []) : undefined,
        order_index: settings.fields.length + 1,
        is_system: false
      };

      setSettings((prev) => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
    }

    setIsFieldModalOpen(false);
  };

  // Options list helpers for select dropdown
  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    const current = fieldFormData.options || [];
    setFieldFormData({ ...fieldFormData, options: [...current, newOptionInput.trim()] });
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    const current = fieldFormData.options || [];
    setFieldFormData({ ...fieldFormData, options: current.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#765941' }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#806957' }}>Loading Pop-up Form Settings...</p>
        </div>
      </div>
    );
  }

  const enabledFields = settings.fields.filter((f) => f.enabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .24s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .24s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input:checked + .toggle-slider {
          background-color: #166534;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        .admin-subtab-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(118,89,65,0.2);
          background: #fff;
          color: #765941;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .admin-subtab-btn:hover {
          background: #FAF7F2;
          border-color: #765941;
        }
        .admin-subtab-btn.active {
          background: #765941;
          color: #F0E2CE;
          border-color: #765941;
        }
      `}</style>

      {/* Top Banner & Action Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px 28px',
          border: '1px solid rgba(118,89,65,0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <SlidersHorizontal style={{ width: '22px', height: '22px', color: '#765941' }} />
            <h2 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '26px', margin: 0, color: '#19120C' }}>
              Pop-up Form Studio
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: settings.is_active ? '#dcfce7' : '#fee2e2',
                color: settings.is_active ? '#166534' : '#991b1b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: settings.is_active ? '#16a34a' : '#dc2626'
                }}
              />
              {settings.is_active ? 'Pop-up Active' : 'Pop-up Disabled'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#806957', maxWidth: '680px' }}>
            Manage consultation pop-up visibility, add or reorder custom input boxes, toggle fields on or off, and adjust WhatsApp routing.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Master Toggle Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 14px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118,89,65,0.2)',
              borderRadius: '6px'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#19120C' }}>
              Master Status:
            </span>
            <label className="toggle-switch" title="Activate or disable the entire pop-up across the site">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
            <span style={{ fontSize: '11px', fontWeight: 700, color: settings.is_active ? '#166534' : '#991b1b' }}>
              {settings.is_active ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'transparent',
              border: '1px solid rgba(118,89,65,0.25)',
              color: '#765941',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 22px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: '#19120C',
              border: '1px solid #19120C',
              color: '#F0E2CE',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? (
              <>
                <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
                Saving Changes...
              </>
            ) : (
              <>
                <Check style={{ width: '15px', height: '15px', color: '#D49E58' }} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            color: '#991b1b',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #4ade80',
            color: '#166534',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Split Layout: Left Controls, Right Sticky Live Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Management Tabs & Form Editors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sub-Tabs Navigation */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`admin-subtab-btn ${activeSection === 'fields' ? 'active' : ''}`}
              onClick={() => setActiveSection('fields')}
            >
              <Layers style={{ width: '15px', height: '15px' }} />
              Form Fields Builder ({settings.fields.filter(f => f.enabled).length}/{settings.fields.length})
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${activeSection === 'triggers' ? 'active' : ''}`}
              onClick={() => setActiveSection('triggers')}
            >
              <Clock style={{ width: '15px', height: '15px' }} />
              Display & Timing
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${activeSection === 'content' ? 'active' : ''}`}
              onClick={() => setActiveSection('content')}
            >
              <FileText style={{ width: '15px', height: '15px' }} />
              Copy & Text
            </button>
            <button
              type="button"
              className={`admin-subtab-btn ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveSection('contact')}
            >
              <MessageSquare style={{ width: '15px', height: '15px' }} />
              WhatsApp & Contact
            </button>
          </div>

          {/* Section 1: Form Fields Builder */}
          {activeSection === 'fields' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 4px', color: '#19120C' }}>
                    Consultation Input Boxes
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#806957' }}>
                    Add new input boxes, enable or disable fields, set mandatory requirements, or reorder the appearance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddField}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#765941',
                    border: '1px solid #765941',
                    color: '#F0E2CE',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus style={{ width: '15px', height: '15px' }} />
                  Add New Input Box
                </button>
              </div>

              {/* Fields List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {settings.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      border: '1px solid rgba(118,89,65,0.18)',
                      backgroundColor: field.enabled ? '#FAF7F2' : '#f8fafc',
                      opacity: field.enabled ? 1 : 0.65,
                      gap: '12px'
                    }}
                  >
                    {/* Left: Reorder arrows & Field Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => moveField(idx, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                          style={{
                            padding: '2px 4px',
                            border: '1px solid rgba(118,89,65,0.2)',
                            background: '#fff',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 1
                          }}
                        >
                          <MoveUp style={{ width: '11px', height: '11px' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(idx, 'down')}
                          disabled={idx === settings.fields.length - 1}
                          title="Move down"
                          style={{
                            padding: '2px 4px',
                            border: '1px solid rgba(118,89,65,0.2)',
                            background: '#fff',
                            cursor: idx === settings.fields.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === settings.fields.length - 1 ? 0.3 : 1
                          }}
                        >
                          <MoveDown style={{ width: '11px', height: '11px' }} />
                        </button>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#19120C' }}>
                            {field.label}
                          </span>
                          {field.required && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '3px' }}>
                              REQUIRED
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '9.5px',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              backgroundColor: 'rgba(118,89,65,0.12)',
                              color: '#765941',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontWeight: 600
                            }}
                          >
                            {field.type}
                          </span>
                          {field.is_system && (
                            <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>[Core System Field]</span>
                          )}
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#806957' }}>
                          Key: <code>{field.name}</code> {field.placeholder ? `• Placeholder: "${field.placeholder}"` : ''}
                          {field.type === 'select' && field.options ? ` • (${field.options.length} options)` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Right: Quick Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleFieldEnabled(field.id)}
                        title={field.enabled ? 'Click to disable field' : 'Click to enable field'}
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: '1px solid',
                          borderColor: field.enabled ? '#86efac' : '#cbd5e1',
                          backgroundColor: field.enabled ? '#f0fdf4' : '#f1f5f9',
                          color: field.enabled ? '#166534' : '#64748b'
                        }}
                      >
                        {field.enabled ? (
                          <>
                            <Eye style={{ width: '12px', height: '12px' }} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <EyeOff style={{ width: '12px', height: '12px' }} />
                            Disabled
                          </>
                        )}
                      </button>

                      {/* Required / Optional Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleFieldRequired(field.id)}
                        title="Toggle whether filling this field is compulsory"
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid rgba(118,89,65,0.2)',
                          backgroundColor: field.required ? '#fef2f2' : '#fff',
                          color: field.required ? '#b91c1c' : '#765941'
                        }}
                      >
                        {field.required ? 'Mandatory' : 'Optional'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditField(field)}
                        title="Edit field settings"
                        style={{
                          padding: '6px 8px',
                          border: '1px solid rgba(118,89,65,0.2)',
                          backgroundColor: '#fff',
                          color: '#765941',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 style={{ width: '13px', height: '13px' }} />
                      </button>

                      {/* Delete Button (Custom fields only) */}
                      {!field.is_system && (
                        <button
                          type="button"
                          onClick={() => deleteField(field.id)}
                          title="Delete this custom field"
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fff',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Display & Timing */}
          {activeSection === 'triggers' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', padding: '24px' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 6px', color: '#19120C' }}>
                Display & Trigger Rules
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957' }}>
                Control how and when the pop-up modal surfaces to visitors on the website.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Master Enable */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FAF7F2', border: '1px solid rgba(118,89,65,0.18)' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: '#19120C' }}>
                      Pop-up Active Everywhere
                    </strong>
                    <span style={{ fontSize: '12px', color: '#806957' }}>
                      If disabled, pop-up will neither auto-open nor trigger from enquiry buttons.
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.is_active}
                      onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* 2. Auto-Popup on Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FAF7F2', border: '1px solid rgba(118,89,65,0.18)' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: '#19120C' }}>
                      Automatic Timed Pop-up
                    </strong>
                    <span style={{ fontSize: '12px', color: '#806957' }}>
                      Open the consultation modal automatically after the visitor lands on the website.
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.auto_popup_enabled}
                      onChange={(e) => setSettings({ ...settings, auto_popup_enabled: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* 3. Timer Delay */}
                {settings.auto_popup_enabled && (
                  <div style={{ padding: '16px', border: '1px solid rgba(118,89,65,0.18)', backgroundColor: '#fff' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#19120C', display: 'block', marginBottom: '8px' }}>
                      Auto-Popup Delay: <span style={{ color: '#765941', fontWeight: 700 }}>{settings.auto_popup_delay} seconds</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={settings.auto_popup_delay}
                      onChange={(e) => setSettings({ ...settings, auto_popup_delay: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#765941' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#806957', marginTop: '4px' }}>
                      <span>1s (Immediate)</span>
                      <span>3s (Default recommended)</span>
                      <span>10s</span>
                      <span>30s</span>
                    </div>
                  </div>
                )}

                {/* 4. Trigger Scope */}
                <div style={{ padding: '16px', border: '1px solid rgba(118,89,65,0.18)', backgroundColor: '#fff' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#19120C', display: 'block', marginBottom: '8px' }}>
                    Target Pages for Auto-Popup
                  </label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="trigger_scope"
                        checked={settings.trigger_scope === 'homepage'}
                        onChange={() => setSettings({ ...settings, trigger_scope: 'homepage' })}
                      />
                      Homepage Only (Recommended)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="trigger_scope"
                        checked={settings.trigger_scope === 'all'}
                        onChange={() => setSettings({ ...settings, trigger_scope: 'all' })}
                      />
                      All Pages
                    </label>
                  </div>
                </div>

                {/* 5. Frequency */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FAF7F2', border: '1px solid rgba(118,89,65,0.18)' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block', color: '#19120C' }}>
                      Show Once Per Browser Session
                    </strong>
                    <span style={{ fontSize: '12px', color: '#806957' }}>
                      Prevents annoying the visitor if they already dismissed or submitted the form.
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.show_once_per_session}
                      onChange={(e) => setSettings({ ...settings, show_once_per_session: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Copy & Text */}
          {activeSection === 'content' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', padding: '24px' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 6px', color: '#19120C' }}>
                Modal Headings, Copy & Actions
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957' }}>
                Customize all customer-facing text, button labels, and secondary actions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Eyebrow */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={settings.eyebrow}
                    onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                    placeholder="e.g. Architectural Consultation"
                  />
                </div>

                {/* Title Prefix & Highlight */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                      Main Heading Prefix
                    </label>
                    <input
                      type="text"
                      value={settings.title_prefix}
                      onChange={(e) => setSettings({ ...settings, title_prefix: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                      placeholder="e.g. Tell us about"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                      Italic Highlight Text
                    </label>
                    <input
                      type="text"
                      value={settings.title_highlight}
                      onChange={(e) => setSettings({ ...settings, title_highlight: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                      placeholder="e.g. your space."
                    />
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                    Subtitle / Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.subtitle}
                    onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px', resize: 'vertical' }}
                    placeholder="Short description under the title..."
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                      Submit Button Label
                    </label>
                    <input
                      type="text"
                      value={settings.submit_btn_text}
                      onChange={(e) => setSettings({ ...settings, submit_btn_text: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                      Submitting State Label
                    </label>
                    <input
                      type="text"
                      value={settings.submitting_btn_text}
                      onChange={(e) => setSettings({ ...settings, submitting_btn_text: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Footnote */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                    Form Footnote / Disclaimer
                  </label>
                  <input
                    type="text"
                    value={settings.footnote}
                    onChange={(e) => setSettings({ ...settings, footnote: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                  />
                </div>

                {/* Dismiss Link */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', alignItems: 'center', padding: '12px', backgroundColor: '#FAF7F2', border: '1px solid rgba(118,89,65,0.18)' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.show_dismiss_link}
                      onChange={(e) => setSettings({ ...settings, show_dismiss_link: e.target.checked })}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#19120C', display: 'block' }}>
                      Show Dismiss Action Link
                    </span>
                    <input
                      type="text"
                      value={settings.dismiss_text}
                      onChange={(e) => setSettings({ ...settings, dismiss_text: e.target.value })}
                      disabled={!settings.show_dismiss_link}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(118,89,65,0.2)', fontSize: '12px', marginTop: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: WhatsApp & Contact */}
          {activeSection === 'contact' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', padding: '24px' }}>
              <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: '0 0 6px', color: '#19120C' }}>
                WhatsApp & Direct Phone Routing
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957' }}>
                Configure WhatsApp auto-forwarding and the direct telephone hotline.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* WhatsApp Auto-Redirect */}
                <div style={{ padding: '16px', border: '1px solid rgba(118,89,65,0.18)', backgroundColor: '#FAF7F2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#19120C', display: 'block' }}>
                        Auto-Redirect to WhatsApp on Submit
                      </strong>
                      <span style={{ fontSize: '12px', color: '#806957' }}>
                        Opens WhatsApp with the client's filled details pre-drafted.
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.whatsapp_enabled}
                        onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                      Target WhatsApp Number (Digits only, including country code)
                    </label>
                    <input
                      type="text"
                      value={settings.whatsapp_number}
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                      placeholder="e.g. 918111899991"
                    />
                  </div>
                </div>

                {/* Direct Call Footer Prompt */}
                <div style={{ padding: '16px', border: '1px solid rgba(118,89,65,0.18)', backgroundColor: '#FAF7F2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#19120C', display: 'block' }}>
                        Show Direct Phone Call Line
                      </strong>
                      <span style={{ fontSize: '12px', color: '#806957' }}>
                        Displays "Prefer to call? +91..." at the base of the modal.
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.show_call_footer}
                        onChange={(e) => setSettings({ ...settings, show_call_footer: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {settings.show_call_footer && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                          Prompt Text
                        </label>
                        <input
                          type="text"
                          value={settings.call_prompt_text}
                          onChange={(e) => setSettings({ ...settings, call_prompt_text: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                          Display Phone Number
                        </label>
                        <input
                          type="text"
                          value={settings.phone_number}
                          onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Success Feedback Banner Message */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#765941', display: 'block', marginBottom: '6px' }}>
                    Success Notification Message
                  </label>
                  <input
                    type="text"
                    value={settings.success_message}
                    onChange={(e) => setSettings({ ...settings, success_message: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Live Interactive Preview */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid rgba(118,89,65,0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            {/* Preview Toolbar */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(118,89,65,0.15)',
                backgroundColor: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye style={{ width: '14px', height: '14px', color: '#765941' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#19120C', letterSpacing: '0.04em' }}>
                  LIVE INTERACTIVE PREVIEW
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  title="Desktop View"
                  style={{
                    padding: '4px 8px',
                    border: '1px solid rgba(118,89,65,0.2)',
                    backgroundColor: previewDevice === 'desktop' ? '#765941' : '#fff',
                    color: previewDevice === 'desktop' ? '#F0E2CE' : '#765941',
                    cursor: 'pointer'
                  }}
                >
                  <Monitor style={{ width: '13px', height: '13px' }} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  title="Mobile View"
                  style={{
                    padding: '4px 8px',
                    border: '1px solid rgba(118,89,65,0.2)',
                    backgroundColor: previewDevice === 'mobile' ? '#765941' : '#fff',
                    color: previewDevice === 'mobile' ? '#F0E2CE' : '#765941',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>

            {/* Inactive Notice Banner if Master Switch is OFF */}
            {!settings.is_active && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  padding: '8px 14px',
                  fontSize: '11.5px',
                  color: '#991b1b',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <EyeOff style={{ width: '13px', height: '13px' }} />
                Note: The Pop-up is currently disabled globally. Visitors will not see this.
              </div>
            )}

            {/* Modal Body Canvas */}
            <div
              style={{
                backgroundColor: '#19120c',
                padding: '24px 16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '520px',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  width: previewDevice === 'mobile' ? '330px' : '480px',
                  backgroundColor: '#F0E2CE',
                  color: '#19120C',
                  border: '1px solid rgba(118,89,65,0.28)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  padding: '30px 28px',
                  transition: 'width 0.25s ease'
                }}
              >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.22em',
                        fontWeight: 700,
                        color: '#765941',
                        display: 'block',
                        marginBottom: '6px'
                      }}
                    >
                      {settings.eyebrow}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'RoelSerif, Georgia, serif',
                        fontSize: previewDevice === 'mobile' ? '28px' : '34px',
                        lineHeight: 1.02,
                        margin: 0,
                        color: '#19120C'
                      }}
                    >
                      {settings.title_prefix} <br />
                      <em style={{ fontStyle: 'italic' }}>{settings.title_highlight}</em>
                    </h3>
                  </div>
                  <button
                    type="button"
                    style={{
                      width: '30px',
                      height: '30px',
                      border: '1px solid rgba(118,89,65,0.28)',
                      background: 'transparent',
                      fontSize: '18px',
                      lineHeight: 1,
                      cursor: 'pointer',
                      color: '#19120C'
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Subtitle */}
                {settings.subtitle && (
                  <p style={{ fontSize: '11.5px', lineHeight: 1.6, color: '#806957', margin: '0 0 20px' }}>
                    {settings.subtitle}
                  </p>
                )}

                {/* Dynamic Form Preview */}
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {enabledFields.map((field) => (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: '#5b4130' }}>
                        {field.label} {field.required ? '*' : ''}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(240,226,206,0.78)',
                            border: '1px solid rgba(118,89,65,0.27)',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(240,226,206,0.78)',
                            border: '1px solid rgba(118,89,65,0.27)',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        >
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(240,226,206,0.78)',
                            border: '1px solid rgba(118,89,65,0.27)',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      backgroundColor: '#19120C',
                      color: '#F0E2CE',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{settings.submit_btn_text}</span>
                    <span style={{ fontSize: '16px' }}>↗</span>
                  </button>

                  {/* Footnote */}
                  {settings.footnote && (
                    <p style={{ fontSize: '9.5px', color: '#765941', margin: '4px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
                      {settings.footnote}
                    </p>
                  )}

                  {/* Dismiss Link */}
                  {settings.show_dismiss_link && (
                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#765941', textDecoration: 'underline', cursor: 'pointer' }}>
                        {settings.dismiss_text}
                      </span>
                    </div>
                  )}

                  {/* Direct Phone Call */}
                  {settings.show_call_footer && (
                    <p style={{ fontSize: '10.5px', color: '#765941', margin: '8px 0 0', textAlign: 'center' }}>
                      {settings.call_prompt_text}{' '}
                      <strong style={{ textDecoration: 'underline' }}>{settings.phone_number}</strong>
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Editor / Add Modal */}
      {isFieldModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(25,18,12,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              backgroundColor: '#fff',
              border: '1px solid rgba(118,89,65,0.25)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(118,89,65,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FAF7F2'
              }}
            >
              <div>
                <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '20px', margin: 0, color: '#19120C' }}>
                  {editingFieldId ? 'Edit Input Box' : 'Add New Input Box'}
                </h3>
                <span style={{ fontSize: '12px', color: '#806957' }}>
                  Configure label, input type, and options
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#19120C' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFieldModal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Field Label */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#19120C', display: 'block', marginBottom: '6px' }}>
                  Field Label *
                </label>
                <input
                  required
                  type="text"
                  value={fieldFormData.label || ''}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                  placeholder="e.g. Estimated Budget, Architect Name, City"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                />
              </div>

              {/* Field Key / Identifier */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#19120C', display: 'block', marginBottom: '6px' }}>
                  Field Identifier Key (Internal)
                </label>
                <input
                  type="text"
                  value={fieldFormData.name || ''}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                  placeholder="Auto-generated if empty (e.g. budget, city)"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px', backgroundColor: '#FAF7F2' }}
                />
              </div>

              {/* Input Type */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#19120C', display: 'block', marginBottom: '6px' }}>
                  Input Box Type
                </label>
                <select
                  value={fieldFormData.type}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, type: e.target.value as any })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                >
                  <option value="text">Single Line Text</option>
                  <option value="tel">Telephone / Phone Number</option>
                  <option value="email">Email Address</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select Menu</option>
                  <option value="textarea">Multiline Textarea</option>
                </select>
              </div>

              {/* Placeholder */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#19120C', display: 'block', marginBottom: '6px' }}>
                  Placeholder Hint
                </label>
                <input
                  type="text"
                  value={fieldFormData.placeholder || ''}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                  placeholder="e.g. ₹5 Lakhs - ₹15 Lakhs"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(118,89,65,0.25)', fontSize: '13px' }}
                />
              </div>

              {/* Dropdown Options Builder (If Type is 'select') */}
              {fieldFormData.type === 'select' && (
                <div style={{ padding: '14px', backgroundColor: '#FAF7F2', border: '1px solid rgba(118,89,65,0.18)' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#765941', display: 'block', marginBottom: '8px' }}>
                    Selectable Dropdown Options
                  </label>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      placeholder="Add new option..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(118,89,65,0.2)', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      style={{ padding: '8px 14px', backgroundColor: '#765941', color: '#F0E2CE', border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                    {(fieldFormData.options || []).map((opt, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          backgroundColor: '#fff',
                          border: '1px solid rgba(118,89,65,0.15)',
                          fontSize: '12px'
                        }}
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '20px', paddingTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fieldFormData.required || false}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, required: e.target.checked })}
                  />
                  <span>Compulsory / Required Field</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fieldFormData.enabled !== false}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, enabled: e.target.checked })}
                  />
                  <span>Active in Form</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid rgba(118,89,65,0.15)' }}>
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  style={{ padding: '9px 16px', border: '1px solid rgba(118,89,65,0.2)', backgroundColor: '#fff', color: '#765941', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', border: '1px solid #19120C', backgroundColor: '#19120C', color: '#F0E2CE', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingFieldId ? 'Apply Changes' : 'Add Input Box'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
