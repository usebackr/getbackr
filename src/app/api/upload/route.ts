import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadFile, getPublicUrl } from '@/lib/storage';
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

    // Get the public URL using our helper
    const publicUrl = getPublicUrl(resultKey);

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
