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

    // Upload to S3 or Local (Dev)
    const resultKey = await uploadFile(buffer, s3Key, file.type);

    let publicUrl = '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (resultKey.startsWith('local:')) {
      const filename = resultKey.replace('local:', '');
      publicUrl = `${appUrl}/uploads/${filename}`;
    } else {
      // S3 Production
      const baseUrl = process.env.NEXT_PUBLIC_S3_URL || `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      publicUrl = process.env.S3_ENDPOINT 
        ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${resultKey}` 
        : `${baseUrl}/${resultKey}`;
    }

    return NextResponse.json({
      message: 'Upload successful',
      url: publicUrl,
      key: resultKey,
    });
  } catch (err: any) {
    console.error('[Upload API] Fatal Error:', err);
    return NextResponse.json(
      { error: `Upload failed: ${err.message || 'Unknown error'}. Please check S3/Local configuration.` },
      { status: 500 },
    );
  }
}
