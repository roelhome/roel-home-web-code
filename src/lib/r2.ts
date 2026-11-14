import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export function getR2Client(runtimeEnv?: Record<string, any>) {
  const accountId = runtimeEnv?.R2_ACCOUNT_ID || 
    (import.meta.env?.R2_ACCOUNT_ID as string) || 
    (globalThis as any)?.process?.env?.R2_ACCOUNT_ID || 
    '73ab4032e13f6c78213e972fa04b380a';

  const accessKeyId = runtimeEnv?.R2_ACCESS_KEY_ID || 
    (import.meta.env?.R2_ACCESS_KEY_ID as string) || 
    (globalThis as any)?.process?.env?.R2_ACCESS_KEY_ID || 
    '';

  const secretAccessKey = runtimeEnv?.R2_SECRET_ACCESS_KEY || 
    (import.meta.env?.R2_SECRET_ACCESS_KEY as string) || 
    (globalThis as any)?.process?.env?.R2_SECRET_ACCESS_KEY || 
    '';

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

export const r2Client = getR2Client();

/**
 * Clean & sanitize a filename
 */
function sanitizeFileName(name: string): string {
  const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'webp';
  const baseName = name
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${baseName}-${timestamp}-${random}.${ext}`;
}

/**
 * Upload a binary Uint8Array directly to Cloudflare R2
 */
export async function uploadToR2({
  fileBuffer,
  fileName,
  contentType,
  folder = 'products',
  env
}: {
  fileBuffer: Uint8Array;
  fileName: string;
  contentType: string;
  folder?: string;
  env?: Record<string, any>;
}): Promise<{ success: boolean; url: string; key: string; error?: string }> {
  try {
    const bucketName = env?.R2_BUCKET_NAME || 
      (import.meta.env?.R2_BUCKET_NAME as string) || 
      (globalThis as any)?.process?.env?.R2_BUCKET_NAME || 
      'roel-homes-media';

    const publicBaseUrl = ((env?.PUBLIC_R2_MEDIA_URL || 
      (import.meta.env?.PUBLIC_R2_MEDIA_URL as string) || 
      (globalThis as any)?.process?.env?.PUBLIC_R2_MEDIA_URL || 
      'https://pub-e465cd37fbf24a1491b461e2ef65364e.r2.dev') as string).replace(/\/$/, '');

    const client = getR2Client(env);
    const cleanName = sanitizeFileName(fileName);
    const key = folder ? `${folder}/${cleanName}` : cleanName;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    });

    await client.send(command);

    const url = `${publicBaseUrl}/${key}`;
    return { success: true, url, key };
  } catch (err: any) {
    console.error('Error uploading to Cloudflare R2:', err);
    return {
      success: false,
      url: '',
      key: '',
      error: err?.message || 'Failed to upload object to Cloudflare R2'
    };
  }
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(keyOrUrl: string, env?: Record<string, any>): Promise<boolean> {
  try {
    const bucketName = env?.R2_BUCKET_NAME || 
      (import.meta.env?.R2_BUCKET_NAME as string) || 
      (globalThis as any)?.process?.env?.R2_BUCKET_NAME || 
      'roel-homes-media';

    const client = getR2Client(env);
    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http')) {
      const urlObj = new URL(keyOrUrl);
      key = urlObj.pathname.replace(/^\//, '');
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await client.send(command);
    return true;
  } catch (err) {
    console.error('Error deleting object from Cloudflare R2:', err);
    return false;
  }
}
