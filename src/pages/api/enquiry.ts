import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendEnquiryEmail } from '../../lib/resend';

// Run on Cloudflare Pages Edge Functions
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid Content-Type, expected JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, phone, email, location, projectType, message, source } = body;

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
    const emailResult = await sendEnquiryEmail({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail || undefined,
      projectType: cleanProjectType,
      message: cleanMessage,
      source: cleanSource
    });

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
