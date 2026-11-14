import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendEnquiryEmail } from '../../lib/resend';

// Run on Cloudflare Pages Edge Functions
export const prerender = false;

// Simple in-memory IP rate limiter
interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  // Periodic cleanup if map grows
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }
  if (now - entry.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  entry.count++;
  return false;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     '127.0.0.1';

    if (checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many enquiry requests from this network. Please wait a few minutes or call us directly.' 
        }), 
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '600' }
        }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid Content-Type, expected JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, phone, email, location, projectType, message, source, honeypot, hp, website_hp } = body;

    // Honeypot check: If any hidden honeypot fields are filled by spam bots, silently drop
    if (honeypot || hp || website_hp) {
      return new Response(JSON.stringify({ success: true, message: 'Your enquiry has been received.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'A valid phone number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Optional email validation
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return new Response(JSON.stringify({ success: false, error: 'Please enter a valid email address' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanPhone = phone.trim().slice(0, 25);
    const cleanLocation = location ? String(location).trim().slice(0, 100) : null;
    const cleanEmail = email ? String(email).trim().slice(0, 100) : null;
    const cleanProjectType = projectType ? String(projectType).trim().slice(0, 50) : 'General';
    const rawMessage = (message && typeof message === 'string' && message.trim()) 
      ? message.trim().slice(0, 3000) 
      : `Client consultation enquiry for ${cleanProjectType}`;
    const cleanMessage = cleanLocation ? `[Location: ${cleanLocation}]\n\n${rawMessage}` : rawMessage;
    const cleanSource = source ? String(source).trim().slice(0, 80) : 'Website Form';

    // 1. Insert into Supabase enquiries table (if available)
    try {
      const { error: dbError } = await supabase.from('enquiries').insert([
        {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          project_type: cleanProjectType,
          message: cleanMessage,
          source: cleanSource,
          status: 'unread'
        }
      ]);

      if (dbError) {
        console.warn('Supabase enquiry insert warning:', dbError.message);
      }
    } catch (dbErr) {
      console.warn('Supabase DB connection error during enquiry insert:', dbErr);
    }

    // 2. Dispatch email notification via Resend
    const runtimeEnv = (locals as any)?.runtime?.env;
    const emailResult = await sendEnquiryEmail({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail || undefined,
      projectType: cleanProjectType,
      message: cleanMessage,
      source: cleanSource
    }, runtimeEnv);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your enquiry has been received successfully. We will get back to you shortly.',
        emailSent: emailResult.success
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Unhandled API error in /api/enquiry:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error processing enquiry. Please contact us via phone.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
