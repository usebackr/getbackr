import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Username may only contain lowercase letters, numbers, and hyphens'),
});

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errors: [{ field: 'body', message: 'Invalid JSON' }] },
      { status: 422 },
    );
  }

  const parsed = usernameSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: z.ZodIssue) => ({
      field: e.path.join('.') || 'unknown',
      message: e.message,
    }));
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { username } = parsed.data;

  // Check uniqueness — exclude the current user so they can "re-set" their own username
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, auth.userId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const [updated] = await db
    .update(users)
    .set({ username, updatedAt: new Date() })
    .where(eq(users.id, auth.userId))
    .returning({ username: users.username });

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ username: updated.username });
}
