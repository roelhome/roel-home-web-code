import React, { useState, useEffect } from 'react';
import {
  getPopupSettings,
  defaultPopupSettings,
  type PopupSettings,
  type PopupFormField
} from '../lib/supabase';

export default function EnquiryModal() {
  const [settings, setSettings] = useState<PopupSettings>(defaultPopupSettings);
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoPopup, setIsAutoPopup] = useState(false);
  const [subject, setSubject] = useState('General project enquiry');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  // 1. Fetch live settings from Supabase
  useEffect(() => {
    let isMounted = true;
    getPopupSettings()
      .then((data) => {
        if (isMounted && data) {
          setSettings(data);
          // Pre-populate default values for select fields
          const defaults: Record<string, string> = {};
          (data.fields || []).forEach((f) => {
            if (f.type === 'select' && f.options && f.options.length > 0) {
              defaults[f.name] = f.options[0];
            }
          });
          setFormValues((prev) => ({ ...defaults, ...prev }));
        }
      })
      .catch((err) => {
        console.warn('Using default popup settings:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Manual trigger listener ([data-enquiry])
  useEffect(() => {
    const handleTrigger = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-enquiry]');
      if (target) {
        // If popup is disabled globally, don't open
        if (!settings.is_active) return;

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
  }, [settings.is_active]);

  // 3. Timed Auto-Popup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if popup is active globally and timed popup is enabled
    if (!settings.is_active || !settings.auto_popup_enabled) return;

    // Check trigger scope
    const pathname = window.location.pathname;
    const isHomePage = pathname === '/' || pathname === '' || pathname === '/index.html';
    if (settings.trigger_scope === 'homepage' && !isHomePage) return;

    // Check query params for forced testing: ?popup=true or ?test=true
    const params = new URLSearchParams(window.location.search);
    const forceTest = params.get('popup') === 'true' || params.get('test') === 'true';

    // Check session storage if once_per_session is required
    let isDismissed = false;
    if (settings.show_once_per_session) {
      try {
        isDismissed = sessionStorage.getItem('roel_popup_dismissed') === 'true';
      } catch (e) {}
    }

    if (!forceTest && isDismissed) return;

    // Configured delay timer
    const delaySeconds = Math.max(1, settings.auto_popup_delay || 3);
    const timer = setTimeout(() => {
      setIsOpen((prev) => {
        if (!prev) {
          setIsAutoPopup(true);
          setSubject('Home Page Architectural Consultation');
          return true;
        }
        return prev;
      });
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [settings.is_active, settings.auto_popup_enabled, settings.auto_popup_delay, settings.trigger_scope, settings.show_once_per_session]);

  // 4. Lenis & Body Scroll lock
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

  // 5. Escape key handler
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

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      setStatus('success');
      setFeedback('Enquiry sent successfully.');
      return;
    }

    const enabledFields = (settings.fields || []).filter((f) => f.enabled);

    // Validate mandatory / required fields
    for (const field of enabledFields) {
      if (field.required) {
        const val = formValues[field.name];
        if (!val || !val.trim()) {
          setStatus('error');
          setFeedback(`Please fill in ${field.label.replace(/\*/g, '').trim()}.`);
          return;
        }
        if (field.type === 'tel' && val.trim().length < 8) {
          setStatus('error');
          setFeedback('Please enter a valid phone number (at least 8 digits).');
          return;
        }
      }
    }

    setStatus('submitting');
    setFeedback(settings.submitting_btn_text || 'Connecting with ROEL specialists...');

    const clientName = formValues['name'] || 'Architectural Client';
    const clientPhone = formValues['phone'] || '';
    const clientLocation = formValues['location'] || '';
    const clientInterest = formValues['interest'] || formValues['projectType'] || subject;

    // Build human-readable formatted enquiry message
    const customLines: string[] = [];
    enabledFields.forEach((f) => {
      const val = formValues[f.name];
      if (val && val.trim()) {
        customLines.push(`• ${f.label.replace(/\*/g, '').trim()}: ${val.trim()}`);
      }
    });

    const summaryMessage = `Consultation request for ${clientInterest}\n\n${customLines.join('\n')}`;

    try {
      // 1. Submit to API (/api/enquiry)
      await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName.trim(),
          phone: clientPhone.trim(),
          location: clientLocation.trim(),
          projectType: clientInterest,
          message: summaryMessage,
          fields: formValues,
          source: isAutoPopup ? 'Home Page Timed Pop-up' : `Enquiry Modal (${subject})`
        })
      });

      // Mark session as complete so popup won't prompt again
      try {
        sessionStorage.setItem('roel_popup_dismissed', 'true');
      } catch (e) {}

      setStatus('success');
      setFeedback(settings.success_message || 'Enquiry registered! Opening WhatsApp to connect directly with our Kochi team...');

      // 2. WhatsApp Auto-Redirect (if enabled)
      if (settings.whatsapp_enabled) {
        const waNumber = (settings.whatsapp_number || '918111899991').replace(/[^0-9]/g, '');
        const waDetails = customLines.length > 0 ? `\n${customLines.join('\n')}\n` : '';
        const waText = encodeURIComponent(
          `Hello ROEL Home Solutions,\n\nNew architectural enquiry\n${waDetails}\nPlease connect with me regarding this project.`
        );
        const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

        setTimeout(() => {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }, 700);
      }
    } catch (err) {
      // Fallback directly to WhatsApp
      if (settings.whatsapp_enabled) {
        const waNumber = (settings.whatsapp_number || '918111899991').replace(/[^0-9]/g, '');
        const waDetails = customLines.length > 0 ? `\n${customLines.join('\n')}\n` : '';
        const waText = encodeURIComponent(
          `Hello ROEL Home Solutions,\n\nNew architectural enquiry\n${waDetails}\nPlease connect with me regarding this project.`
        );
        window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank', 'noopener,noreferrer');
      }
      setStatus('success');
      setFeedback('Enquiry sent! Directing to WhatsApp...');
    }
  };

  // If popup is closed or globally disabled, render nothing
  if (!isOpen || !settings.is_active) return null;

  const enabledFields = (settings.fields || [])
    .filter((f) => f.enabled)
    .sort((a, b) => a.order_index - b.order_index);

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
                {isAutoPopup ? (settings.eyebrow || 'Architectural Consultation') : (settings.eyebrow || 'Quick enquiry')}
              </span>
              <h2>
                {settings.title_prefix || 'Tell us about'}<br />
                <em className="italic">{settings.title_highlight || 'your space.'}</em>
              </h2>
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

          {settings.subtitle && (
            <p className="modal-sub">
              {settings.subtitle}
            </p>
          )}

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

            {/* Dynamic Form Fields Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}
            >
              {enabledFields.map((field) => {
                const isFullWidth = field.type === 'textarea';
                const fieldId = `popup-input-${field.id}`;

                return (
                  <div
                    key={field.id}
                    className="field"
                    style={{
                      margin: 0,
                      gridColumn: isFullWidth ? '1 / -1' : undefined
                    }}
                  >
                    <label htmlFor={fieldId}>
                      {field.label} {field.required ? '*' : ''}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        id={fieldId}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        rows={3}
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={fieldId}
                        name={field.name}
                        required={field.required}
                        value={formValues[field.name] || (field.options?.[0] || '')}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      >
                        {(field.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={fieldId}
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        autoComplete={field.name === 'phone' ? 'tel' : field.name === 'name' ? 'name' : undefined}
                        value={formValues[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <button
              className="btn"
              type="submit"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={status === 'submitting'}
            >
              <span>
                {status === 'submitting'
                  ? (settings.submitting_btn_text || 'Submitting...')
                  : (settings.submit_btn_text || 'Request Consultation & Connect')}
              </span>
              <span className="arrow">↗</span>
            </button>

            {/* Footnote */}
            {settings.footnote && (
              <p className="form-note">
                {settings.footnote}
              </p>
            )}

            {/* Status Feedback Message */}
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

            {/* Dismiss Link */}
            {settings.show_dismiss_link && (
              <button
                type="button"
                className="modal-dismiss-link"
                onClick={handleClose}
              >
                {settings.dismiss_text || 'Explore the collection on my own first →'}
              </button>
            )}
          </form>

          {/* Direct Phone Call Prompt */}
          {settings.show_call_footer && (
            <p style={{ font: '11px RoelSans, sans-serif', color: 'var(--walnut)', margin: '14px 0 0', textAlign: 'center' }}>
              {settings.call_prompt_text || 'Prefer to call?'}{' '}
              <a
                href={`tel:${(settings.phone_number || '+918111899991').replace(/[^0-9+]/g, '')}`}
                style={{ textDecoration: 'underline', fontWeight: 'bold' }}
              >
                {settings.phone_number || '+91 81118 99991'}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
