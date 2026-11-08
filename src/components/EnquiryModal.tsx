import React, { useState, useEffect } from 'react';

export default function EnquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('General project enquiry');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('Residential');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Listen to global click events on [data-enquiry] buttons
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-enquiry]');
      if (target) {
        e.preventDefault();
        const ctx = target.getAttribute('data-enquiry') || 'General project enquiry';
        setSubject(ctx);
        setMessage(ctx !== 'General project enquiry' ? `I am interested in: ${ctx}. Please share details.` : '');
        setStatus('idle');
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleTrigger);
    return () => document.removeEventListener('click', handleTrigger);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
      if ((window as any).roelLenis) {
        (window as any).roelLenis.stop();
      }
    } else {
      document.body.classList.remove('no-scroll');
      if ((window as any).roelLenis) {
        (window as any).roelLenis.start();
      }
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot anti-spam check
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
          source: `Quick Enquiry Modal (${subject})`
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
        setErrorMessage(data.error || 'Unable to submit your enquiry. Please reach us via WhatsApp.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error. Please contact us directly via WhatsApp or Phone.');
    }
  };

  if (!isOpen) return null;

  const waText = encodeURIComponent(`Hello ROEL, I would like to enquire about: ${subject}. My name is ${name || 'a visitor'}.`);
  const waUrl = `https://wa.me/918111899991?text=${waText}`;

  return (
    <div 
      className="modal-overlay open" 
      data-lenis-prevent="true"
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div 
        className="modal-dialog" 
        data-lenis-prevent="true"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-enquiry-title"
      >
        <button 
          className="modal-close" 
          type="button" 
          onClick={() => setIsOpen(false)} 
          aria-label="Close dialog"
        >
          ×
        </button>

        <div style={{ marginBottom: '24px' }}>
          <span className="eyebrow" style={{ color: 'var(--walnut)' }}>Quick Enquiry</span>
          <h2 id="modal-enquiry-title" style={{ font: "400 clamp(28px, 4vw, 38px) 'RoelSerif', serif", margin: '8px 0' }}>
            Tell us about <em className="italic">your space.</em>
          </h2>
          <p className="muted" style={{ fontSize: '13px', lineHeight: 1.5 }}>
            {subject !== 'General project enquiry' ? `Referencing: ${subject}` : 'Share your ideas or requirements. Our Kochi team is here to assist.'}
          </p>
        </div>

        {status === 'success' ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>
              ✓
            </div>
            <h3 style={{ font: "400 26px 'RoelSerif', serif" }}>Enquiry Received</h3>
            <p className="muted" style={{ margin: '12px 0 24px', fontSize: '14px' }}>
              Thank you! Your details have been sent directly to the ROEL Home Solutions team in Kochi. We will contact you shortly.
            </p>
            <button className="btn" type="button" onClick={() => setIsOpen(false)}>
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid">
            {/* Honeypot field for bot spam prevention */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="hp_field">Leave this empty</label>
              <input id="hp_field" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>

            <div className="field">
              <label htmlFor="modal-name">Your Name *</label>
              <input 
                id="modal-name" 
                required 
                maxLength={80} 
                placeholder="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div className="field">
                <label htmlFor="modal-phone">Phone Number *</label>
                <input 
                  id="modal-phone" 
                  type="tel" 
                  required 
                  placeholder="+91" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>

              <div className="field">
                <label htmlFor="modal-email">Email (Optional)</label>
                <input 
                  id="modal-email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="modal-type">Project Type</label>
              <select 
                id="modal-type" 
                value={projectType} 
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="Residential">Residential Residence / Villa</option>
                <option value="Commercial">Commercial Office / Studio</option>
                <option value="Renovation">Interior Renovation</option>
                <option value="Wall Solutions">Fluted Walls & Panelling</option>
                <option value="Premium Doors">Architectural Doors</option>
                <option value="Decorative Accents">CNC Screens & Accents</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="modal-message">Your Message or Requirements *</label>
              <textarea 
                id="modal-message" 
                rows={3} 
                required 
                placeholder="Provide rough dimensions, material interests, or location..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
              />
            </div>

            {status === 'error' && (
              <div style={{ color: '#b91c1c', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '2px' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                className="btn gold" 
                disabled={status === 'submitting'}
                style={{ flex: '1', minWidth: '150px' }}
              >
                {status === 'submitting' ? 'Submitting...' : 'Send Enquiry'} <span className="arrow">↗</span>
              </button>

              <a 
                href={waUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn" 
                style={{ flex: '1', minWidth: '150px', borderColor: 'var(--walnut)' }}
              >
                WhatsApp <span className="arrow">↗</span>
              </a>
            </div>

            <p className="micro muted" style={{ textAlign: 'center', marginTop: '10px' }}>
              Prefer to call directly? <a href="tel:+918111899991" style={{ textDecoration: 'underline', color: 'var(--ink)' }}>+91 81118 99991</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
