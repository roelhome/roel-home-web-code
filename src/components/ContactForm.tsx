import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('Material consultation');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      setStatus('success');
      setFeedback('Enquiry sent.');
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
      // 1. Submit to API endpoint
      await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          projectType: interest,
          message: message.trim(),
          source: 'Contact Page Form'
        })
      });

      // 2. Prepare WhatsApp message
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew website enquiry\nName: ${name.trim()}\nPhone: ${phone.trim()}\nInterest: ${interest}\nRequirement: ${message.trim()}\n\nPlease contact me about this enquiry.`
      );
      const waUrl = `https://wa.me/918111899991?text=${waText}`;

      setStatus('success');
      setFeedback('Enquiry sent! Opening WhatsApp to connect directly with our Kochi team...');

      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 700);

    } catch (err) {
      const waText = encodeURIComponent(
        `Hello ROEL Home Solutions,\n\nNew website enquiry\nName: ${name.trim()}\nPhone: ${phone.trim()}\nInterest: ${interest}\nRequirement: ${message.trim()}\n\nPlease contact me about this enquiry.`
      );
      window.open(`https://wa.me/918111899991?text=${waText}`, '_blank', 'noopener,noreferrer');
      setStatus('success');
      setFeedback('Opening WhatsApp to connect directly with our Kochi team...');
    }
  };

  return (
    <form id="contact-form" onSubmit={handleSubmit}>
      {/* Honeypot field */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="contact-hp">Leave empty</label>
        <input 
          id="contact-hp" 
          value={honeypot} 
          onChange={(e) => setHoneypot(e.target.value)} 
          tabIndex={-1} 
          autoComplete="off" 
        />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="contact-name">Your name *</label>
          <input 
            required 
            maxLength={80} 
            id="contact-name" 
            name="name" 
            placeholder="Full name" 
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="contact-phone">Phone number *</label>
          <input 
            required 
            minLength={10} 
            maxLength={18} 
            pattern="[+0-9() .-]{10,18}" 
            id="contact-phone" 
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
        <label htmlFor="contact-interest">I'm interested in</label>
        <select 
          id="contact-interest" 
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
        <label htmlFor="contact-message">Tell us about your project *</label>
        <textarea 
          required 
          maxLength={1000} 
          id="contact-message" 
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
  );
}
