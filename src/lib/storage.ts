import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
    });
  }
  return s3;
};

const BUCKET = process.env.S3_BUCKET ?? '';

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
      throw new Error(`Local storage failed: ${err.message}`);
    }
  }

  // S3 Production
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    }),
  );
  return key;
}
