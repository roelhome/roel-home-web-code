import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLogin } from './AdminLogin';
import { LeadsManager } from './LeadsManager';
import { ProductsManager } from './ProductsManager';
import { CategoriesManager } from './CategoriesManager';
import { ProjectsManager } from './ProjectsManager';
import { HeroManager } from './HeroManager';
import { ImageDropzone } from './ImageDropzone';
import {
  Inbox,
  Package,
  Tag,
  Building2,
  Cloud,
  LogOut,
  ExternalLink,
  Loader2,
  Menu,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
} from 'lucide-react';

type TabKey = 'leads' | 'hero' | 'products' | 'categories' | 'projects' | 'media';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  description: string;
}

export const AdminLayout: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('leads');
  const [unreadLeads, setUnreadLeads] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('roel_admin_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setAuthChecking(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch unread leads count
  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      try {
        const { count } = await supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread');
        setUnreadLeads(count || 0);
      } catch (e) {
        console.error('Count error:', e);
      }
    };
    fetchUnread();
  }, [session, activeTab]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('roel_admin_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const navItems: NavItem[] = [
    {
      key: 'leads',
      label: 'Leads & Inquiries',
      description: 'Customer requests & quotes',
      icon: Inbox
    },
    {
      key: 'hero',
      label: 'Hero Banners',
      description: 'Homepage landscape slides & headings',
      icon: Sparkles
    },
    {
      key: 'products',
      label: 'Products & Variants',
      description: 'Catalog, pricing & matrix',
      icon: Package
    },
    {
      key: 'categories',
      label: 'Categories',
      description: 'Collections & navigation',
      icon: Tag
    },
    {
      key: 'projects',
      label: 'Projects & Spaces',
      description: 'Architectural portfolio CRUD',
      icon: Building2
    },
    {
      key: 'media',
      label: 'Cloudflare R2 Media',
      description: 'S3 storage bucket & CDN',
      icon: Cloud
    }
  ];

  const currentTabMeta = navItems.find((item) => item.key === activeTab) || navItems[0];

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: '#14110E',
          color: '#F0E2CE',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            style={{
              width: '32px',
              height: '32px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
              color: '#D49E58'
            }}
          />
          <p style={{ margin: 0, fontSize: '13px', letterSpacing: '0.06em', color: 'rgba(240,226,206,0.7)' }}>
            Loading ROEL Studio Admin...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show login
  if (!session) {
    return <AdminLogin onSuccess={() => setAuthChecking(false)} />;
  }

  const userInitial = (session?.user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F7F3EE',
        color: '#19120C',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative'
      }}
    >
      <style>{`
        /* Smooth transitions & hovers */
        .roel-nav-btn:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #F0E2CE !important;
        }
        .roel-nav-btn.active {
          background-color: rgba(212, 158, 88, 0.14) !important;
          color: #E5BF8C !important;
          font-weight: 600 !important;
        }
        .roel-icon-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #F0E2CE !important;
        }
        .roel-logout-btn:hover {
          color: #ef4444 !important;
        }

        /* Mobile Drawer Breakpoint */
        @media (max-width: 900px) {
          .roel-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 100;
            width: 240px !important;
            min-width: 240px !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
          }
          .roel-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .roel-mobile-backdrop {
            display: block !important;
          }
          .roel-mobile-topbar {
            display: flex !important;
          }
        }
      `}</style>

      {/* Mobile Backdrop */}
      <div
        className="roel-mobile-backdrop"
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 7, 5, 0.65)',
          backdropFilter: 'blur(2px)',
          zIndex: 95,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Option 1: Linear / Vercel Minimalist Vertical Sidebar */}
      <aside
        className={`roel-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '60px' : '240px',
          minWidth: isCollapsed ? '60px' : '240px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          backgroundColor: '#14110E',
          color: '#F0E2CE',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(229, 191, 140, 0.12)',
          zIndex: 80,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            height: '56px',
            padding: isCollapsed ? '0' : '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {/* Expanded Brand View */}
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                title="Infrastructure Live (Supabase + Cloudflare R2)"
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                  display: 'inline-block'
                }}
              />
              <span
                style={{
                  fontFamily: 'RoelSerif, Georgia, serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#F0E2CE'
                }}
              >
                ROEL
              </span>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={toggleSidebarCollapse}
            className="roel-icon-btn"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(240, 226, 206, 0.6)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            {isCollapsed ? (
              <PanelLeftOpen style={{ width: '18px', height: '18px', color: '#D49E58' }} />
            ) : (
              <PanelLeftClose style={{ width: '17px', height: '17px' }} />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? '12px 6px' : '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            overflowY: 'auto'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            const isLeads = item.key === 'leads';

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setMobileOpen(false);
                }}
                className={`roel-nav-btn ${isActive ? 'active' : ''}`}
                title={isCollapsed ? `${item.label}${isLeads && unreadLeads > 0 ? ` (${unreadLeads} unread)` : ''}` : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '12px',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  background: isActive ? 'rgba(212, 158, 88, 0.14)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: isActive ? '#E5BF8C' : 'rgba(240, 226, 206, 0.68)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon
                    style={{
                      width: '17px',
                      height: '17px',
                      color: isActive ? '#D49E58' : 'currentColor',
                      flexShrink: 0
                    }}
                  />
                  {/* Collapsed 6px Red Notification Dot */}
                  {isCollapsed && isLeads && unreadLeads > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-5px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444'
                      }}
                    />
                  )}
                </div>

                {/* Expanded Label */}
                {!isCollapsed && (
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {/* Expanded Unread Badge */}
                {!isCollapsed && isLeads && unreadLeads > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}
                  >
                    {unreadLeads}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Clean Minimalist Footer */}
        <div
          style={{
            padding: isCollapsed ? '12px 0' : '12px 14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '10px'
          }}
        >
          {/* Avatar Circle */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 158, 88, 0.2)',
              color: '#D49E58',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0
            }}
            title={session?.user?.email || 'Administrator'}
          >
            {userInitial}
          </div>

          {/* User Email (Expanded only) */}
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#F0E2CE',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={session?.user?.email}
              >
                {session?.user?.email || 'admin@roelhome.com'}
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="roel-logout-btn"
            title="Sign out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(240, 226, 206, 0.45)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
          >
            <LogOut style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header Bar (<= 900px only) */}
        <div
          className="roel-mobile-topbar"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            backgroundColor: '#14110E',
            borderBottom: '1px solid rgba(229, 191, 140, 0.15)',
            color: '#F0E2CE',
            position: 'sticky',
            top: 0,
            zIndex: 70
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(229,191,140,0.3)',
                color: '#F0E2CE',
                borderRadius: '4px',
                padding: '5px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              aria-label="Open menu"
            >
              <Menu style={{ width: '18px', height: '18px' }} />
            </button>
            <span style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '17px', color: '#F0E2CE' }}>
              ROEL Studio
            </span>
          </div>

          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '2px 8px',
              backgroundColor: 'rgba(212,158,88,0.15)',
              color: '#D49E58',
              borderRadius: '3px',
              fontWeight: 600
            }}
          >
            {currentTabMeta.label.split(' ')[0]}
          </span>
        </div>

        {/* Content Topbar (Desktop) */}
        <header
          style={{
            height: '56px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <currentTabMeta.icon style={{ width: '18px', height: '18px', color: '#D49E58' }} />
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#19120C' }}>
              {currentTabMeta.label}
            </h1>
            {currentTabMeta.key === 'leads' && unreadLeads > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}
              >
                {unreadLeads} new
              </span>
            )}
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#765941',
              textDecoration: 'none',
              padding: '6px 12px',
              backgroundColor: '#FAF7F2',
              border: '1px solid rgba(118, 89, 65, 0.18)',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Globe style={{ width: '13px', height: '13px' }} />
            Live Website
            <ExternalLink style={{ width: '11px', height: '11px', opacity: 0.6 }} />
          </a>
        </header>

        {/* Main Content Viewport */}
        <main
          style={{
            flex: 1,
            padding: '28px 32px 64px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {activeTab === 'leads' && <LeadsManager />}
          {activeTab === 'hero' && <HeroManager />}
          {activeTab === 'products' && <ProductsManager />}
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'projects' && <ProjectsManager />}
          {activeTab === 'media' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: '#fff', padding: '28px', border: '1px solid rgba(118,89,65,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Cloud style={{ width: '22px', height: '22px', color: '#765941' }} />
                  <h2 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '24px', margin: 0 }}>
                    Cloudflare R2 Storage Hub
                  </h2>
                </div>
                <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#806957', maxWidth: '700px' }}>
                  Your media assets are directly hosted on Cloudflare R2 bucket <code>roel-homes-media</code>.
                  Below you can test drag-and-drop file uploads, copy public CDN links, or verify asset delivery.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px'
                  }}
                >
                  <div style={{ padding: '16px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.2)' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block', fontWeight: 700 }}>
                      Bucket Name
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#19120C' }}>roel-homes-media</span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.2)' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block', fontWeight: 700 }}>
                      Public CDN Subdomain
                    </span>
                    <a
                      href="https://pub-e465cd37fbf24a1491b461e2ef65364e.r2.dev/test/verify.txt"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', fontWeight: 600, color: '#765941', wordBreak: 'break-all' }}
                    >
                      https://pub-e465cd37fbf24a1491b461e2ef65364e.r2.dev
                    </a>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#F0E2CE', border: '1px solid rgba(118,89,65,0.2)' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#806957', display: 'block', fontWeight: 700 }}>
                      Egress Fees
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>₹0 / Free Unlimited Egress</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(118,89,65,0.15)', paddingTop: '24px' }}>
                  <h3 style={{ fontFamily: 'RoelSerif, Georgia, serif', fontSize: '18px', margin: '0 0 12px' }}>
                    Quick Drag & Drop Asset Uploader
                  </h3>
                  <ImageDropzone
                    multiple
                    folder="general"
                    onChange={(urls) => {
                      console.log('Uploaded images to R2:', urls);
                    }}
                    label="Drop Any Photos To Upload to R2"
                    hint="Drag images here to upload directly into Cloudflare R2 bucket."
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
