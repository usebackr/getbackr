import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailContacts } from '@/db/schema/emailContacts';
import { requirePremium } from '@/lib/middleware/premiumGuard';
import { eq, and } from 'drizzle-orm';

/**
 * Minimal CSV parser — handles quoted fields and optional header row.
 * Expects columns: email (required), name (optional).
 */
function parseContactsCsv(csvText: string): Array<{ email: string; name?: string }> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const contacts: Array<{ email: string; name?: string }> = [];

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('email');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  let emailIndex = 0;
  let nameIndex = -1;

  if (hasHeader) {
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    emailIndex = headers.indexOf('email');
    nameIndex = headers.indexOf('name');
    if (emailIndex === -1) emailIndex = 0;
  }

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const email = cols[emailIndex]?.trim();
    if (!email || !email.includes('@')) continue;
    const name = nameIndex >= 0 ? cols[nameIndex]?.trim() : undefined;
    contacts.push({ email, name: name || undefined });
  }

  return contacts;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const result = await requirePremium(req);
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  let csvText: string;
  try {
    const formData = await req.formData();
    const file = formData.get('contacts');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { errors: [{ field: 'contacts', message: 'CSV file is required' }] },
        { status: 422 },
      );
    }
    csvText = await (file as File).text();
  } catch {
    return NextResponse.json({ error: 'Failed to read form data' }, { status: 400 });
  }

  const contacts = parseContactsCsv(csvText);

  if (contacts.length === 0) {
    return NextResponse.json(
      { errors: [{ field: 'contacts', message: 'No valid contacts found in CSV' }] },
      { status: 422 },
    );
  }

  // Upsert contacts — insert new, skip existing (by creator_id + email)
  let imported = 0;
  for (const contact of contacts) {
    try {
      await db
        .insert(emailContacts)
        .values({
          creatorId: userId,
          email: contact.email,
          source: 'imported',
        })
        .onConflictDoNothing();
      imported++;
    } catch {
      // Skip duplicates or invalid rows
    }
  }

  return NextResponse.json({ imported });
}
