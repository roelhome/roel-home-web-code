import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = (import.meta.env.R2_ACCOUNT_ID as string) || '73ab4032e13f6c78213e972fa04b380a';
const accessKeyId = (import.meta.env.R2_ACCESS_KEY_ID as string) || '58968de4ba7314a942b53d122aaefee3';
const secretAccessKey = (import.meta.env.R2_SECRET_ACCESS_KEY as string) || '5e84153e6aa4bbfae564329513c3cbc24b4ff744bce12ff095f18e96f11261ef';
const bucketName = (import.meta.env.R2_BUCKET_NAME as string) || 'roel-homes-media';
const publicBaseUrl = ((import.meta.env.PUBLIC_R2_MEDIA_URL as string) || 'https://pub-e465cd37fbf24a1491b461e2ef65364e.r2.dev').replace(/\/$/, '');

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

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
  folder = 'products'
}: {
  fileBuffer: Uint8Array;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<{ success: boolean; url: string; key: string; error?: string }> {
  try {
    const cleanName = sanitizeFileName(fileName);
    const key = folder ? `${folder}/${cleanName}` : cleanName;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    });

    await r2Client.send(command);

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
export async function deleteFromR2(keyOrUrl: string): Promise<boolean> {
  try {
    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http')) {
      const urlObj = new URL(keyOrUrl);
      key = urlObj.pathname.replace(/^\//, '');
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await r2Client.send(command);
    return true;
  } catch (err) {
    console.error('Error deleting object from Cloudflare R2:', err);
    return false;
  }
}
