import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadFile } from '@/lib/storage';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
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

  const legalName = formData.get('legalName') as string;
  const idType = formData.get('idType') as string;
  const idNumber = formData.get('idNumber') as string;
  const idDocumentFile = formData.get('id_document');
  const selfieFile = formData.get('selfie');

  if (!legalName || !idType || !idNumber || !(idDocumentFile instanceof File) || !(selfieFile instanceof File)) {
    return NextResponse.json(
      { error: 'All fields and documents are required' },
      { status: 422 },
    );
  }

  const idDocumentBuffer = Buffer.from(await idDocumentFile.arrayBuffer());
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

  const idDocumentKey = `kyc/${userId}/id_document_${Date.now()}`;
  const selfieKey = `kyc/${userId}/selfie_${Date.now()}`;

  try {
    await uploadFile(
      idDocumentBuffer,
      idDocumentKey,
      idDocumentFile.type || 'application/octet-stream',
    );
    await uploadFile(selfieBuffer, selfieKey, selfieFile.type || 'application/octet-stream');
  } catch (err) {
    console.error('[KYC Submit] Upload Error:', err);
    return NextResponse.json(
      { error: 'Document upload failed. Please try again.' },
      { status: 500 },
    );
  }

  // Update or insert into kycProfiles
  try {
    await db.transaction(async (tx) => {
      // Check if profile exists
      const [existing] = await tx.select().from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);
      
      if (existing) {
        await tx.update(kycProfiles).set({
          legalName,
          idType,
          idNumber,
          documentUrl: idDocumentKey,
          updatedAt: new Date(),
        }).where(eq(kycProfiles.userId, userId));
      } else {
        await tx.insert(kycProfiles).values({
          userId,
          legalName,
          idType,
          idNumber,
          documentUrl: idDocumentKey,
        });
      }

      await tx.update(users).set({ kycStatus: 'pending' }).where(eq(users.id, userId));
    });

    // Trigger background process if queue exists
    try {
      const kycQueue = getQueue(QUEUE_NAMES.KYC_PROCESS);
      await kycQueue.add({ userId, idDocumentKey, selfieKey });
    } catch {
      // Ignore queue if local dev doesn't have Redis
    }

    return NextResponse.json({ message: 'KYC submission received' }, { status: 200 });
  } catch (err: any) {
    console.error('[KYC Submit] DB Error:', err);
    return NextResponse.json({ error: 'Failed to update KYC status' }, { status: 500 });
  }
}
