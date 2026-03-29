import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { uploadFile } from '@/lib/storage';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { eq } from 'drizzle-orm';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB per file

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
    return NextResponse.json({ error: 'All fields and both documents are required' }, { status: 422 });
  }

  // Enforce file size limits (2 MB each)
  if (idDocumentFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'ID document must be under 2 MB. Please compress before uploading.' }, { status: 413 });
  }
  if (selfieFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Selfie photo must be under 2 MB. Please compress before uploading.' }, { status: 413 });
  }

  const idDocumentBuffer = Buffer.from(await idDocumentFile.arrayBuffer());
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

  const ts = Date.now();
  const idDocumentKey = `kyc/${userId}/id_document_${ts}`;
  const selfieKey = `kyc/${userId}/selfie_${ts}`;

  try {
    await uploadFile(idDocumentBuffer, idDocumentKey, idDocumentFile.type || 'image/jpeg');
    await uploadFile(selfieBuffer, selfieKey, selfieFile.type || 'image/jpeg');
  } catch (err) {
    console.error('[KYC Submit] Upload Error:', err);
    return NextResponse.json({ error: 'Document upload failed. Please try again.' }, { status: 500 });
  }

  // Upsert kycProfiles — store BOTH image URLs
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: kycProfiles.id }).from(kycProfiles).where(eq(kycProfiles.userId, userId)).limit(1);

      if (existing) {
        await tx.update(kycProfiles).set({
          legalName,
          idType,
          idNumber,
          documentUrl: idDocumentKey,
          selfieUrl: selfieKey,
          rejectionReason: null,     // Clear old rejection on re-submission
          updatedAt: new Date(),
        }).where(eq(kycProfiles.userId, userId));
      } else {
        await tx.insert(kycProfiles).values({
          userId,
          legalName,
          idType,
          idNumber,
          documentUrl: idDocumentKey,
          selfieUrl: selfieKey,
        });
      }

      await tx.update(users).set({ kycStatus: 'pending', kycRejectionReason: null }).where(eq(users.id, userId));
    });

    return NextResponse.json({ message: 'KYC submission received. You will be notified within 24-48 hours.' }, { status: 200 });
  } catch (err: any) {
    console.error('[KYC Submit] DB Error:', err);
    return NextResponse.json({ error: 'Failed to save KYC details' }, { status: 500 });
  }
}
