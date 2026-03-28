import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { emailContacts } from '@/db/schema/emailContacts';

const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Decodes an unsubscribe token.
 * Token format: base64(creatorId:email)
 */
function decodeUnsubscribeToken(token: string): { creatorId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return null;
    const creatorId = decoded.slice(0, colonIndex);
    const email = decoded.slice(colonIndex + 1);
    if (!creatorId || !email || !email.includes('@')) return null;
    return { creatorId, email };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        errors: parsed.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 422 },
    );
  }

  const { token } = parsed.data;
  const decoded = decodeUnsubscribeToken(token);

  if (!decoded) {
    return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
  }

  const { creatorId, email } = decoded;

  // Find the contact record
  const contact = await db.query.emailContacts.findFirst({
    where: and(eq(emailContacts.creatorId, creatorId), eq(emailContacts.email, email)),
  });

  if (!contact) {
    // Return success even if not found to avoid email enumeration
    return NextResponse.json({ message: 'You have been unsubscribed.' });
  }

  if (!contact.unsubscribed) {
    await db
      .update(emailContacts)
      .set({ unsubscribed: true, unsubscribedAt: new Date() })
      .where(eq(emailContacts.id, contact.id));
  }

  return NextResponse.json({ message: 'You have been unsubscribed.' });
}
