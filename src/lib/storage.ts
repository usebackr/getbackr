import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import fs from 'fs';
import path from 'path';

// Get credentials from either S3_ or AWS_ prefixes
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';
const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';

// Determine if we should use local storage
// Fallback to local if we're in dev, or if keys are empty/dummy
const isDev = 
  process.env.NODE_ENV === 'development' || 
  !accessKeyId || 
  accessKeyId.includes('your-');

// Lazy-initialize S3 client so it doesn't throw error if we only use local storage
let s3: S3Client | null = null;
const getS3Client = () => {
  if (!s3) {
    let finalEndpoint = (process.env.S3_ENDPOINT || '').trim();
    if (finalEndpoint && !finalEndpoint.startsWith('http')) {
      finalEndpoint = `https://${finalEndpoint}`;
    }
    
    // Crucial: remove trailing slashes otherwise AWS SDK corrupts the SNI Host
    while(finalEndpoint && finalEndpoint.endsWith('/')) {
      finalEndpoint = finalEndpoint.slice(0, -1);
    }

    // Sanitize region: if it starts with http, it's actually an endpoint
    let finalRegion = (region || 'us-east-1').trim();
    if (finalRegion.startsWith('http')) {
      console.log(`[Storage] Detected URL in S3_REGION (${finalRegion}). Resetting to default for S3 client.`);
      if (!finalEndpoint) {
        finalEndpoint = finalRegion;
      }
      // If we are on Supabase, eu-west-1 or us-east-1 is common. 
      // We will fallback to eu-west-1 if that's what we saw in the screenshot.
      finalRegion = 'eu-west-1'; 
    }

    console.log(`[Storage] Final S3 Config:`, {
      region: finalRegion,
      endpoint: finalEndpoint,
      bucket: BUCKET,
      accessKeyId: accessKeyId ? `${accessKeyId.slice(0, 4)}...` : 'MISSING',
    });

    s3 = new S3Client({
      region: finalRegion,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
      forcePathStyle: true, // Required for Supabase S3
      requestHandler: new FetchHttpHandler({ keepAlive: false }), // Force using global fetch to bypass Node TLS SNI errors on Vercel
      ...(finalEndpoint ? { endpoint: finalEndpoint } : {}),
    });
  }
  return s3;
};

const BUCKET = (process.env.S3_BUCKET || process.env.AWS_BUCKET || '').trim().replace(/\s+/g, '-');

/**
 * Uploads a file to S3 or local disk (in dev) and returns the key.
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  if (isDev) {
    console.log(`[Storage] Dev mode detected. Key: ${key}`);
    // Local fallback
    const localDir = path.join(process.cwd(), 'public', 'uploads');
    const filename = path.basename(key);
    const fullPath = path.join(localDir, filename);

    console.log(`[Storage] Target Dir: ${localDir}`);
    console.log(`[Storage] Target File: ${fullPath}`);

    try {
      // Ensure directory exists
      if (!fs.existsSync(localDir)) {
        console.log(`[Storage] Creating directory: ${localDir}`);
        fs.mkdirSync(localDir, { recursive: true });
      }

      await fs.promises.writeFile(fullPath, buffer);
      console.log(`[Storage] Successfully saved locally to: ${fullPath}`);
      return `local:${filename}`;
    } catch (err: any) {
      console.error(`[Storage] Local write failed:`, err);
      // On platforms like Vercel with read-only file systems, we shouldn't attempt local writes
      if (err.code === 'EROFS') {
        throw new Error(`Cloud deployment detected but S3 credentials missing. Please set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET in your environment variables.`);
      }
      throw new Error(`Local storage failed: ${err.message}`);
    }
  }

  if (!BUCKET) {
    throw new Error('S3_BUCKET environment variable is missing. Please configure your AWS/S3 bucket name in Vercel settings.');
  }

  // S3 Production
  const client = getS3Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
    console.log(`[Storage] Successfully uploaded to S3: ${key} in bucket ${BUCKET}`);
    return key;
  } catch (err: any) {
    console.error(`[Storage] S3 Upload failed for bucket ${BUCKET}:`, err.name, err.message);
    
    if (err.name === 'NoSuchBucket' || err.message?.toLowerCase().includes('not found')) {
      throw new Error(`The storage bucket "${BUCKET}" does not exist in your Supabase project. Please log into Supabase, go to Storage, and create a PUBLIC bucket named exactly "${BUCKET}".`);
    }
    
    throw new Error(`Cloud storage upload failed: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Construct a public URL for a given file key or existing URL string.
 * Handles local vs S3/Supabase formatting.
 * Self-heals broken Supabase S3 API URLs into Public Object URLs.
 */
export function getPublicUrl(keyOrUrl: string | null): string {
  if (!keyOrUrl) return '';
  
  // If it's already a local path
  if (keyOrUrl.startsWith('local:')) {
    const filename = keyOrUrl.replace('local:', '');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/uploads/${filename}`;
  }

  // If it's already a full URL, check if it's a broken Supabase S3 API URL
  if (keyOrUrl.startsWith('http')) {
    if (keyOrUrl.includes('storage.supabase.co') && keyOrUrl.includes('/storage/v1/s3/')) {
      // Self-heal: Convert S3 API URL to Public Object URL
      // From: https://[id].storage.supabase.co/storage/v1/s3/[bucket]/[key]
      // To:   https://[id].supabase.co/storage/v1/object/public/[bucket]/[key]
      return keyOrUrl
        .replace('.storage.supabase.co', '.supabase.co')
        .replace('/storage/v1/s3/', '/storage/v1/object/public/');
    }
    return keyOrUrl;
  }

  // Otherwise assume it's a raw S3 Key
  const s3Endpoint = (process.env.S3_ENDPOINT || '').trim();
  const bucket = BUCKET;

  if (s3Endpoint.includes('supabase.co')) {
    const projectId = s3Endpoint.split('.')[0].replace('https://', '').replace('.storage', '');
    return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${keyOrUrl}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_S3_URL || `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`;
  return `${baseUrl}/${keyOrUrl}`;
}
