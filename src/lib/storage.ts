import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
});

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
    // Local fallback
    const localDir = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(localDir, path.basename(key));

    // Ensure directory exists
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);
    console.log(`[Storage] Saved locally to: ${fullPath}`);
    return `local:${path.basename(key)}`;
  }

  // S3 Production
  await s3.send(
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
