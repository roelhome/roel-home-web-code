import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('hello@roelhome.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#19120C',
        padding: '24px',
        fontFamily: "RoelSans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#F0E2CE',
          padding: '44px 36px',
          border: '1px solid rgba(229,191,140,0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'rgba(118,89,65,0.15)',
              color: '#765941',
              fontSize: '10px',
              letterSpacing: '0.22em',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}
          >
            <ShieldCheck style={{ width: '13px', height: '13px' }} />
            ROEL Administrative Portal
          </div>
          <h1
            style={{
              fontFamily: 'RoelSerif, Georgia, serif',
              fontSize: '34px',
              fontWeight: 400,
              color: '#19120C',
              margin: '0 0 8px',
              letterSpacing: '-0.02em'
            }}
          >
            Studio Sign In
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#806957' }}>
            Manage leads, products, variants, and Cloudflare media
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '12.5px',
              lineHeight: 1.5,
              borderLeft: '3px solid #dc2626'
            }}
          >
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 700,
                color: '#5b4130',
                marginBottom: '8px'
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#765941'
                }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 14px 14px 42px',
                  backgroundColor: '#fff',
                  border: '1px solid rgba(118,89,65,0.3)',
                  fontSize: '14px',
                  color: '#19120C',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 700,
                color: '#5b4130',
                marginBottom: '8px'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#765941'
                }}
              />
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 14px 14px 42px',
                  backgroundColor: '#fff',
                  border: '1px solid rgba(118,89,65,0.3)',
                  fontSize: '14px',
                  color: '#19120C',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '15px 24px',
              backgroundColor: '#19120C',
              color: '#F0E2CE',
              border: 'none',
              fontSize: '12px',
              letterSpacing: '0.12em',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Studio
                <ArrowRight style={{ width: '15px', height: '15px', color: '#D49E58' }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(118,89,65,0.2)', textAlign: 'center' }}>
          <a
            href="/"
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: '#765941',
              textDecoration: 'none'
            }}
          >
            ← Back to Public Website
          </a>
        </div>
      </div>
    </div>
  );
};
