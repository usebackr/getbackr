import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Common POST endpoint for file uploads.
 * Body: FormData with 'file' and 'type' (e.g. 'kyc', 'campaign', 'profile')
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadType = (formData.get('type') as string) || 'misc';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'tmp';
    const fileName = `${uuidv4()}.${fileExt}`;
    const s3Key = `${uploadType}/${userId}/${fileName}`;

    // Upload to S3 using existing wrapper
    await uploadFile(buffer, s3Key, file.type);

    // Form the Public URL (assuming the bucket is public-read or using a proxy)
    // If the bucket is not public, we would normally use a signed URL strategy.
    // Given the previous code returns the 'key', we will return the full path here.
    const baseUrl = process.env.NEXT_PUBLIC_S3_URL || `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    // If S3_ENDPOINT is set (e.g. Supabase), use that.
    const publicUrl = process.env.S3_ENDPOINT 
      ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${s3Key}` 
      : `${baseUrl}/${s3Key}`;

    return NextResponse.json({
      message: 'Upload successful',
      url: publicUrl,
      key: s3Key,
    });
  } catch (err: any) {
    console.error('[Upload API] Error:', err);
    return NextResponse.json(
      { error: 'Upload failed. Please check S3 configuration.' },
      { status: 500 },
    );
  }
}
