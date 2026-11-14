import { Resend } from 'resend';

const resendApiKey = (import.meta as any).env?.RESEND_API_KEY || (globalThis as any).process?.env?.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEnquiryParams {
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  message: string;
  source?: string;
}

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendEnquiryEmail(params: SendEnquiryParams, runtimeEnv?: Record<string, any>) {
  const apiKey = runtimeEnv?.RESEND_API_KEY || resendApiKey;
  const client = apiKey ? new Resend(apiKey) : resend;

  if (!client) {
    console.log('[Dev] Resend API key not configured. Mock email dispatched:', params);
    return { success: true, mocked: true };
  }

  const notificationEmail = runtimeEnv?.NOTIFICATION_EMAIL || (import.meta as any).env?.NOTIFICATION_EMAIL || (globalThis as any).process?.env?.NOTIFICATION_EMAIL || 'info@roelhome.com';

  const safeName = escapeHtml(params.name);
  const safePhone = escapeHtml(params.phone);
  const cleanPhoneTel = params.phone.replace(/[^0-9+]/g, '');
  const safeEmail = params.email ? escapeHtml(params.email) : '';
  const safeProjectType = escapeHtml(params.projectType || 'General Consultation');
  const safeMessage = escapeHtml(params.message);
  const safeSource = escapeHtml(params.source || 'Website Contact Form');

  try {
    const data = await resend.emails.send({
      from: 'ROEL Website <onboarding@resend.dev>', // or custom domain when verified
      to: [notificationEmail],
      replyTo: params.email ? params.email.trim() : undefined,
      subject: `New Client Enquiry from ${safeName} (${safeProjectType})`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF7F2; border: 1px solid #E5BF8C; border-radius: 4px;">
          <h2 style="color: #19120C; margin-top: 0; font-weight: normal; border-bottom: 1px solid #D49E58; padding-bottom: 12px;">
            ROEL Home Solutions — New Project Enquiry
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold; width: 140px;">Client Name:</td>
              <td style="padding: 8px 0; color: #19120C;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; color: #19120C;"><a href="tel:${cleanPhoneTel}" style="color: #765941;">${safePhone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #19120C;">${safeEmail || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Project Type:</td>
              <td style="padding: 8px 0; color: #19120C;">${safeProjectType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #19120C; white-space: pre-wrap;">${safeMessage}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #D7B691; font-size: 12px; color: #806957;">
            Source: ${safeSource} | Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
        </div>
      `
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending enquiry email via Resend:', error);
    return { success: false, error };
  }
}
