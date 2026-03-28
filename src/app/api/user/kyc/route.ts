import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { verifyAccessToken } from '@/lib/auth/jwt';

const kycSchema = z.object({
  legalName: z.string().min(2, 'Legal name is required'),
  idType: z.enum(['Passport', 'Driver License', 'National ID']),
  idNumber: z.string().min(5, 'Valid ID number is required'),
  documentUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const body = await req.json();
    const parsed = kycSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: parsed.error.errors,
        },
        { status: 422 },
      );
    }

    const { legalName, idType, idNumber, documentUrl } = parsed.data;

    await db.transaction(async (tx) => {
      // Upsert KYC Profile
      await tx
        .insert(kycProfiles)
        .values({
          userId,
          legalName,
          idType,
          idNumber,
          documentUrl: documentUrl || null,
        })
        .onConflictDoUpdate({
          target: kycProfiles.userId,
          set: {
            legalName,
            idType,
            idNumber,
            documentUrl: documentUrl || null,
            updatedAt: new Date(),
          },
        });

      // Update user KYC status to verified (mocking an automatic approval for the MVP)
      await tx.update(users).set({ kycStatus: 'verified' }).where(eq(users.id, userId));
    });

    return NextResponse.json(
      { message: 'KYC Verification Submitted Successfully' },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[KYC Submission] Error:', err);
    return NextResponse.json({ error: 'Server error saving KYC details' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const [profile] = await db
      .select()
      .from(kycProfiles)
      .where(eq(kycProfiles.userId, userId))
      .limit(1);
    const [user] = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      profile: profile || null,
      status: user?.kycStatus || 'pending',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch KYC details' }, { status: 500 });
  }
}
