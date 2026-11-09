import React, { useState, useEffect } from 'react';

export default function EnquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoPopup, setIsAutoPopup] = useState(false);
  const [subject, setSubject] = useState('General project enquiry');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [interest, setInterest] = useState('Distinctive Doors & Entrance Systems');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  // 1. Manual trigger listener ([data-enquiry])
  useEffect(() => {
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-enquiry]');
      if (target) {
        e.preventDefault();
        const ctx = target.getAttribute('data-enquiry') || 'General project enquiry';
        setSubject(ctx);
        setIsAutoPopup(false);
        setStatus('idle');
        setFeedback('');
        setIsOpen(true);
      }
    };

    document.addEventListener('click', handleTrigger);
    return () => document.removeEventListener('click', handleTrigger);
  }, []);

  // 2. 3-Second Auto-Popup on Home Page (Once per session)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if on home page
    const pathname = window.location.pathname;
    const isHomePage = pathname === '/' || pathname === '' || pathname === '/index.html';
    if (!isHomePage) return;

    // Check query params for forced testing: ?popup=true or ?test=true
    const params = new URLSearchParams(window.location.search);
    const forceTest = params.get('popup') === 'true' || params.get('test') === 'true';

    // Check session storage
    let isDismissed = false;
    try {
      isDismissed = sessionStorage.getItem('roel_popup_dismissed') === 'true';
    } catch (e) {}

    if (!forceTest && isDismissed) return;

    // 3-second delay
    const timer = setTimeout(() => {
      setIsOpen((prev) => {
        if (!prev) {
          setIsAutoPopup(true);
          setSubject('Home Page Architectural Consultation');
          return true;
        }
        return prev;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Lenis & Body Scroll lock
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

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('roel_popup_dismissed', 'true');
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      setStatus('success');
      setFeedback('Enquiry sent successfully.');
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setStatus('error');
      setFeedback('Please fill in your name and phone number.');
      return;
    }

    setStatus('submitting');
    setFeedback('Connecting with ROEL specialists...');

    const summaryMessage = `Client consultation request for ${interest}${location.trim() ? ` (Location: ${location.trim()})` : ''}`;

    try {
      // 1. Submit to Cloudflare Pages / Supabase & Resend API
      await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          projectType: interest,
          message: summaryMessage,
          source: isAutoPopup ? 'Home Page 3s Consultation Pop-up' : `Enquiry Modal (${subject})`
        })
      });

      // Mark session as complete so popup won't show again
      try {
        sessionStorage.setItem('roel_popup_dismissed', 'true');
      } catch (e) {}

      // 2. Prepare WhatsApp draft for immediate personal communication
      const locationText = location.trim() ? `\n• Location: ${location.trim()}` : '';
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew architectural enquiry\n• Name: ${name.trim()}\n• Phone: ${phone.trim()}${locationText}\n• Looking for: ${interest}\n\nPlease connect with me regarding this project.`
      );
      const waUrl = `https://wa.me/918111899991?text=${waText}`;

      setStatus('success');
      setFeedback('Enquiry registered! Opening WhatsApp to connect directly with our Kochi team...');

      // Open WhatsApp after a brief delay
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 700);

    } catch (err) {
      // Fallback directly to WhatsApp
      const locationText = location.trim() ? `\n• Location: ${location.trim()}` : '';
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew architectural enquiry\n• Name: ${name.trim()}\n• Phone: ${phone.trim()}${locationText}\n• Looking for: ${interest}\n\nPlease connect with me regarding this project.`
      );
      window.open(`https://wa.me/918111899991?text=${waText}`, '_blank', 'noopener,noreferrer');
      setStatus('success');
      setFeedback('Opening WhatsApp to connect directly with our Kochi team...');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-root open" 
      id="modal-root" 
      data-lenis-prevent="true"
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="modal-shade" 
        onClick={handleClose}
        aria-hidden="true"
      />
      <div 
        className="modal-dialog" 
        data-lenis-prevent="true"
      >
        <div className="modal-inner">
          <div className="modal-head">
            <div>
              <span className="eyebrow">
                {isAutoPopup ? 'Architectural Consultation' : 'Quick enquiry'}
              </span>
              <h2>Tell us about<br /><em className="italic">your space.</em></h2>
            </div>
            <button 
              className="modal-close" 
              type="button" 
              onClick={handleClose} 
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

          <p className="modal-sub">
            Connect directly with our Kochi design specialists for distinctive doors, wall solutions, and curated surface materials.
          </p>

          <form id="quick-form" onSubmit={handleSubmit}>
            {/* Honeypot for bot spam prevention */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="quick-hp">Leave empty</label>
              <input 
                id="quick-hp" 
                value={honeypot} 
                onChange={(e) => setHoneypot(e.target.value)} 
                tabIndex={-1} 
                autoComplete="off" 
              />
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="quick-name">Your name *</label>
                <input 
                  required 
                  maxLength={80} 
                  id="quick-name" 
                  name="name" 
                  placeholder="Full name" 
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="quick-phone">Phone number *</label>
                <input 
                  required 
                  minLength={10} 
                  maxLength={18} 
                  pattern="[+0-9() .-]{10,18}" 
                  id="quick-phone" 
                  name="phone" 
                  type="tel" 
                  placeholder="+91 (WhatsApp preferred)" 
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="quick-location">City / Location</label>
                <input 
                  maxLength={80} 
                  id="quick-location" 
                  name="location" 
                  placeholder="e.g. Kochi, Calicut, Bangalore" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="quick-interest">I'm looking for</label>
                <select 
                  id="quick-interest" 
                  name="interest"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  <option value="Distinctive Doors & Entrance Systems">Distinctive Doors & Entrance Systems</option>
                  <option value="Acoustic & Fluted Wall Solutions">Acoustic & Fluted Wall Solutions</option>
                  <option value="Curated Stone & Veneer Surfaces">Curated Stone & Veneer Surfaces</option>
                  <option value="Complete Space Consultation">Complete Space Consultation</option>
                  <option value="Project Material Supply">Project Material Supply</option>
                  <option value="Other Project Enquiry">Other Project Enquiry</option>
                </select>
              </div>
            </div>

            <button 
              className="btn" 
              type="submit" 
              style={{ width: '100%', marginTop: '8px' }}
              disabled={status === 'submitting'}
            >
              <span>{status === 'submitting' ? 'Submitting...' : 'Request Consultation & Connect'}</span>
              <span className="arrow">↗</span>
            </button>

            <p className="form-note">
              Records your requirements with ROEL Home Solutions and connects you directly on WhatsApp.
            </p>

            {feedback && (
              <div 
                className="form-feedback" 
                role="status" 
                aria-live="polite"
                style={{ color: status === 'error' ? '#b91c1c' : 'var(--walnut)' }}
              >
                {feedback}
              </div>
            )}

            <button 
              type="button" 
              className="modal-dismiss-link" 
              onClick={handleClose}
            >
              Explore the collection on my own first &rarr;
            </button>
          </form>

          <p style={{ font: '11px RoelSans, sans-serif', color: 'var(--walnut)', margin: '14px 0 0', textAlign: 'center' }}>
            Prefer to call? <a href="tel:+918111899991" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>+91 81118 99991</a>
          </p>
        </div>
      </div>
    </div>
  );
}
