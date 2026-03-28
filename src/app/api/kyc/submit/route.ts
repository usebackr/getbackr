import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadFile } from '@/lib/storage';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { getQueue, QUEUE_NAMES } from '@/lib/queue';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 422 });
  }

  const idDocumentFile = formData.get('id_document');
  const selfieFile = formData.get('selfie');

  if (!(idDocumentFile instanceof File) || !(selfieFile instanceof File)) {
    return NextResponse.json(
      { errors: [{ field: 'id_document', message: 'id_document and selfie files are required' }] },
      { status: 422 },
    );
  }

  const idDocumentBuffer = Buffer.from(await idDocumentFile.arrayBuffer());
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

  const idDocumentKey = `kyc/${userId}/id_document`;
  const selfieKey = `kyc/${userId}/selfie`;

  try {
    await uploadFile(
      idDocumentBuffer,
      idDocumentKey,
      idDocumentFile.type || 'application/octet-stream',
    );
    await uploadFile(selfieBuffer, selfieKey, selfieFile.type || 'application/octet-stream');
  } catch {
    return NextResponse.json(
      { error: 'Document upload failed. Please try again.' },
      { status: 422 },
    );
  }

  await db.update(users).set({ kycStatus: 'pending' }).where(eq(users.id, userId));

  const kycQueue = getQueue(QUEUE_NAMES.KYC_PROCESS);
  await kycQueue.add({ userId, idDocumentKey, selfieKey });

  return NextResponse.json({ message: 'KYC submission received' }, { status: 200 });
}
