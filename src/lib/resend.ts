import { Resend } from 'resend';

const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEnquiryParams {
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  message: string;
  source?: string;
}

export async function sendEnquiryEmail(params: SendEnquiryParams) {
  if (!resend) {
    console.log('[Dev] Resend API key not configured. Mock email dispatched:', params);
    return { success: true, mocked: true };
  }

  const notificationEmail = import.meta.env.NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || 'info@roelhome.com';

  try {
    const data = await resend.emails.send({
      from: 'ROEL Website <onboarding@resend.dev>', // or custom domain when verified
      to: [notificationEmail],
      replyTo: params.email || undefined,
      subject: `New Client Enquiry from ${params.name} (${params.projectType || 'General'})`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF7F2; border: 1px solid #E5BF8C; border-radius: 4px;">
          <h2 style="color: #19120C; margin-top: 0; font-weight: normal; border-bottom: 1px solid #D49E58; padding-bottom: 12px;">
            ROEL Home Solutions — New Project Enquiry
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold; width: 140px;">Client Name:</td>
              <td style="padding: 8px 0; color: #19120C;">${params.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0; color: #19120C;"><a href="tel:${params.phone}" style="color: #765941;">${params.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #19120C;">${params.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold;">Project Type:</td>
              <td style="padding: 8px 0; color: #19120C;">${params.projectType || 'General Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #765941; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #19120C; white-space: pre-wrap;">${params.message}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #D7B691; font-size: 12px; color: #806957;">
            Source: ${params.source || 'Website Contact Form'} | Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
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
