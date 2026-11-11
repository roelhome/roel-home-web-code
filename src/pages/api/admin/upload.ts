import type { APIRoute } from 'astro';
import { uploadToR2 } from '../../../lib/r2';

export const prerender = false;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4'
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Expected multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || 'products';

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP, AVIF, SVG, MP4`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: 'File size exceeds maximum limit of 15MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const result = await uploadToR2({
      fileBuffer: buffer,
      fileName: file.name,
      contentType: file.type,
      folder
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Upload failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: result.url,
        key: result.key,
        fileName: file.name,
        size: file.size,
        type: file.type
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('API Upload error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Server error processing upload' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
