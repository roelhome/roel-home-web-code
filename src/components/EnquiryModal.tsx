import React, { useState, useEffect } from 'react';

export default function EnquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('General project enquiry');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('Material consultation');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-enquiry]');
      if (target) {
        e.preventDefault();
        const ctx = target.getAttribute('data-enquiry') || 'General project enquiry';
        setSubject(ctx);
        setMessage(ctx !== 'General project enquiry' ? `Enquiry regarding: ${ctx}\n` : '');
        setStatus('idle');
        setFeedback('');
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

    if (honeypot) {
      setStatus('success');
      setFeedback('Enquiry sent successfully.');
      return;
    }

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setStatus('error');
      setFeedback('Please fill in your name, phone number, and message.');
      return;
    }

    setStatus('submitting');
    setFeedback('Sending enquiry...');

    try {
      // 1. Submit to Cloudflare Pages / Supabase & Resend API
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          projectType: interest,
          message: message.trim(),
          source: `Quick Enquiry Modal (${subject})`
        })
      });

      const resData = await res.json().catch(() => ({}));

      // 2. Also prepare WhatsApp draft for seamless communication
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew website enquiry\nName: ${name.trim()}\nPhone: ${phone.trim()}\nInterest: ${interest}\nRequirement: ${message.trim()}\n\nPlease contact me about this enquiry.`
      );
      const waUrl = `https://wa.me/918111899991?text=${waText}`;

      setStatus('success');
      setFeedback('Enquiry sent! Opening WhatsApp to connect directly with our Kochi team...');

      // Open WhatsApp after a brief delay
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 700);

    } catch (err) {
      // Fallback directly to WhatsApp
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew website enquiry\nName: ${name.trim()}\nPhone: ${phone.trim()}\nInterest: ${interest}\nRequirement: ${message.trim()}\n\nPlease contact me about this enquiry.`
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
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div 
        className="modal-dialog" 
        data-lenis-prevent="true"
      >
        <div className="modal-inner">
          <div className="modal-head">
            <div>
              <span className="eyebrow">Quick enquiry</span>
              <h2>Tell us about<br /><em className="italic">your space.</em></h2>
            </div>
            <button 
              className="modal-close" 
              type="button" 
              onClick={() => setIsOpen(false)} 
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

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
                  placeholder="+91" 
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="quick-interest">I'm interested in</label>
              <select 
                id="quick-interest" 
                name="interest"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              >
                <option value="Material consultation">Material consultation</option>
                <option value="Wall solutions">Wall solutions</option>
                <option value="Premium doors">Premium doors</option>
                <option value="Decorative accents">Decorative accents</option>
                <option value="Project supply">Project supply</option>
                <option value="Other enquiry">Other enquiry</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="quick-message">Tell us about your project *</label>
              <textarea 
                required 
                maxLength={1000} 
                id="quick-message" 
                name="message" 
                placeholder="Your space, requirements, location or any detail you would like to share..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button 
              className="btn" 
              type="submit" 
              style={{ width: '100%' }}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Continue enquiry on WhatsApp'} <span className="arrow">↗</span>
            </button>

            <p className="form-note">
              This enquiry is recorded by ROEL and opens a WhatsApp chat for immediate communication.
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
          </form>

          <p style={{ font: '11px RoelSans, sans-serif', color: 'var(--walnut)', margin: '14px 0 0' }}>
            Prefer to call? <a href="tel:+918111899991" style={{ textDecoration: 'underline' }}>+91 81118 99991</a>
          </p>
        </div>
      </div>
    </div>
  );
}
