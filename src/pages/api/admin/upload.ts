import type { APIRoute } from 'astro';
import { uploadToR2 } from '../../../lib/r2';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v'
]);

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate the request via Supabase Bearer token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Authentication required to upload media' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired admin session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Expected multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const rawFolder = (formData.get('folder') as string) || 'products';
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'products';

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
          error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP, AVIF, SVG, MP4, WEBM, MOV`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: 'File size exceeds maximum limit of 30MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const runtimeEnv = (locals as any)?.runtime?.env;

    const result = await uploadToR2({
      fileBuffer: buffer,
      fileName: file.name,
      contentType: file.type,
      folder,
      env: runtimeEnv
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
