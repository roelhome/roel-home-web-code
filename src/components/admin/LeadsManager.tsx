import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search,
  Download,
  Phone,
  MessageSquare,
  Eye,
  Trash2,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  project_type: string | null;
  message: string;
  source: string;
  status: string;
  created_at: string;
}

export const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Enquiry | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this lead?')) return;

    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', id);
      if (error) throw error;

      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete lead.');
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Date', 'Name', 'Phone', 'Email', 'Project Type', 'Status', 'Message'];
    const rows = filteredLeads.map((l) => [
      new Date(l.created_at).toLocaleString(),
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.project_type || '').replace(/"/g, '""')}"`,
      l.status,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roel-homes-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      lead.name?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.project_type?.toLowerCase().includes(query) ||
      lead.message?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Metrics
  const totalLeads = leads.length;
  const unreadCount = leads.filter((l) => l.status === 'unread').length;
  const contactedCount = leads.filter((l) => l.status === 'contacted').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return { bg: '#fee2e2', color: '#991b1b', text: 'New / Unread' };
      case 'contacted':
        return { bg: '#fef3c7', color: '#92400e', text: 'In Discussion' };
      case 'converted':
        return { bg: '#dcfce7', color: '#166534', text: 'Converted' };
      case 'archived':
        return { bg: '#e5e7eb', color: '#374151', text: 'Archived' };
      default:
        return { bg: '#f3f4f6', color: '#4b5563', text: status };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid rgba(118,89,65,0.2)' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#806957' }}>
            Total Inquiries
          </span>
          <div style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '32px', color: '#19120C', marginTop: '6px' }}>
            {totalLeads}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid rgba(118,89,65,0.2)', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#991b1b' }}>
            Unread / Action Required
          </span>
          <div style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '32px', color: '#991b1b', marginTop: '6px' }}>
            {unreadCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid rgba(118,89,65,0.2)', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#92400e' }}>
            In Discussion
          </span>
          <div style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '32px', color: '#92400e', marginTop: '6px' }}>
            {contactedCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid rgba(118,89,65,0.2)', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#166534' }}>
            Converted Clients
          </span>
          <div style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '32px', color: '#166534', marginTop: '6px' }}>
            {convertedCount}
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Export */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          backgroundColor: '#fff',
          padding: '16px 20px',
          border: '1px solid rgba(118,89,65,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
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
              placeholder="Search leads by name, phone, type..."
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

          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'unread', 'contacted', 'converted', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  border: '1px solid',
                  borderColor: statusFilter === status ? '#19120C' : 'rgba(118,89,65,0.2)',
                  backgroundColor: statusFilter === status ? '#19120C' : '#fff',
                  color: statusFilter === status ? '#F0E2CE' : '#765941',
                  cursor: 'pointer'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchLeads}
            title="Refresh list"
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
            onClick={exportCSV}
            style={{
              padding: '9px 16px',
              backgroundColor: '#765941',
              color: '#F0E2CE',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.05em'
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{ backgroundColor: '#fff', border: '1px solid rgba(118,89,65,0.2)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#765941' }}>
            <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading inquiries from Supabase...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#806957' }}>
            <p style={{ fontSize: '15px', margin: '0 0 6px', fontWeight: 600 }}>No inquiries found</p>
            <p style={{ fontSize: '12px', margin: 0 }}>
              {search ? 'Try clearing your search query.' : 'New customer enquiries submitted from the website will appear here in real time.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(240,226,206,0.5)', borderBottom: '1px solid rgba(118,89,65,0.2)' }}>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Client Name
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Phone & Contact
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Project Type
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Status
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130' }}>
                  Date
                </th>
                <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5b4130', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const badge = getStatusBadge(lead.status);
                const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                const waLink = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                  `Hello ${lead.name}, this is ROEL Home Solutions regarding your recent enquiry for ${lead.project_type || 'Architectural Materials'}. How may we assist your project?`
                )}`;

                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    style={{
                      borderBottom: '1px solid rgba(118,89,65,0.12)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(215,182,145,0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 18px', fontWeight: 600, color: '#19120C' }}>
                      {lead.name}
                      {lead.source && (
                        <span style={{ display: 'block', fontSize: '10px', color: '#806957', fontWeight: 400 }}>
                          via {lead.source}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 18px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`tel:${lead.phone}`}
                          style={{ color: '#19120C', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {lead.phone}
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Message client on WhatsApp"
                          style={{
                            color: '#16a34a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 6px',
                            backgroundColor: '#dcfce7',
                            borderRadius: '3px',
                            fontSize: '11px',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageSquare style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                          WA
                        </a>
                      </div>
                      {lead.email && <div style={{ fontSize: '11px', color: '#806957', marginTop: '2px' }}>{lead.email}</div>}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(118,89,65,0.1)',
                          color: '#765941',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '2px'
                        }}
                      >
                        {lead.project_type || 'General Consultation'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: 'none',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '3px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="unread">New / Unread</option>
                        <option value="contacted">In Discussion</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    <td style={{ padding: '16px 18px', color: '#806957', fontSize: '12px' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td style={{ padding: '16px 18px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          title="View Details"
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(118,89,65,0.2)',
                            color: '#765941',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.id)}
                          title="Delete Lead"
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(185,28,28,0.2)',
                            color: '#b91c1c',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(25,18,12,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '36px',
              border: '1px solid rgba(229,191,140,0.4)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedLead(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#765941'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#765941', fontWeight: 700 }}>
              Lead Inquiry Details
            </div>
            <h2
              style={{
                fontFamily: 'RoelSerif, Georgia, serif',
                fontSize: '28px',
                margin: '8px 0 20px',
                color: '#19120C'
              }}
            >
              {selectedLead.name}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#F0E2CE',
                marginBottom: '24px'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block' }}>
                  Phone Number
                </span>
                <a
                  href={`tel:${selectedLead.phone}`}
                  style={{ fontSize: '14px', fontWeight: 600, color: '#19120C', textDecoration: 'none' }}
                >
                  {selectedLead.phone}
                </a>
              </div>

              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block' }}>
                  Email Address
                </span>
                <span style={{ fontSize: '14px', color: '#19120C' }}>{selectedLead.email || 'Not provided'}</span>
              </div>

              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block' }}>
                  Project Interest
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#765941' }}>
                  {selectedLead.project_type || 'General Consultation'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block' }}>
                  Date Received
                </span>
                <span style={{ fontSize: '14px', color: '#19120C' }}>
                  {new Date(selectedLead.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                  color: '#5b4130',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Inquiry Requirements / Message:
              </span>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f9f6f2',
                  border: '1px solid rgba(118,89,65,0.2)',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#19120C',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedLead.message}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#765941', fontWeight: 600 }}>Update Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => updateStatus(selectedLead.id, e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(118,89,65,0.3)',
                    backgroundColor: '#fff',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <option value="unread">New / Unread</option>
                  <option value="contacted">In Discussion</option>
                  <option value="converted">Converted Client</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://wa.me/91${(selectedLead.phone || '').replace(/[^0-9]/g, '').slice(-10)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare style={{ width: '14px', height: '14px' }} />
                  WhatsApp
                </a>
                <a
                  href={`tel:${selectedLead.phone}`}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#19120C',
                    color: '#F0E2CE',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Phone style={{ width: '14px', height: '14px' }} />
                  Call Client
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
