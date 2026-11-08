import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('Residential Residence');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      setStatus('success');
      return;
    }

    if (!name || !phone || !message) {
      setErrorMessage('Please fill in your name, phone number, and message.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          projectType,
          message,
          source: 'Contact Page Form'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit enquiry. Please call us directly.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network connection error. Please call us at +91 81118 99991.');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(212, 158, 88, 0.12)', border: '1px solid var(--gold)', padding: '40px', borderRadius: '2px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>
          ✓
        </div>
        <h3 style={{ font: "400 32px 'RoelSerif', serif", margin: '8px 0' }}>Thank You for Reaching Out</h3>
        <p className="muted" style={{ maxWidth: '440px', margin: '12px auto 24px' }}>
          We have received your enquiry. Our team in Kochi will review your project details and reach out via phone or WhatsApp shortly.
        </p>
        <button 
          type="button" 
          className="btn" 
          onClick={() => setStatus('idle')}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div style={{ display: 'none' }} aria-hidden="true">
        <input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="field">
          <label htmlFor="contact-name">Your Full Name *</label>
          <input 
            id="contact-name" 
            required 
            maxLength={80} 
            placeholder="e.g. Rahul Menon" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="field">
          <label htmlFor="contact-phone">Phone Number *</label>
          <input 
            id="contact-phone" 
            type="tel" 
            required 
            placeholder="+91 98..." 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="field">
          <label htmlFor="contact-email">Email Address</label>
          <input 
            id="contact-email" 
            type="email" 
            placeholder="rahul@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="field">
          <label htmlFor="contact-project-type">Project Classification</label>
          <select 
            id="contact-project-type" 
            value={projectType} 
            onChange={(e) => setProjectType(e.target.value)}
          >
            <option value="Residential Residence">Residential Residence / Villa</option>
            <option value="Commercial Project">Commercial / Office Interior</option>
            <option value="Architectural Renovation">Architectural Renovation</option>
            <option value="Fluted Wall Panelling">Fluted Wall Panelling</option>
            <option value="Signature Doors">Signature Wooden Doors</option>
            <option value="Material Consultation">Material Consultation Only</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-message">Project Description & Requirements *</label>
        <textarea 
          id="contact-message" 
          rows={5} 
          required 
          placeholder="Tell us about the space, room sizes, design preferences, or materials you are looking to source..." 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
        />
      </div>

      {status === 'error' && (
        <div style={{ color: '#b91c1c', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '2px' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
        <button 
          type="submit" 
          className="btn gold" 
          disabled={status === 'submitting'}
          style={{ minWidth: '200px' }}
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Message'} <span className="arrow">↗</span>
        </button>

        <span className="micro muted">
          Direct Line: <a href="tel:+918111899991" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>+91 81118 99991</a>
        </span>
      </div>
    </form>
  );
}
