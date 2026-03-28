import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { requireAuth } from '@/lib/auth/middleware';

const updateProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  socialLinks: z.record(z.string(), z.string().url()).optional(),
  category: z.string().max(50).optional(),
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

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e: z.ZodIssue) => ({
      field: e.path.join('.') || 'unknown',
      message: e.message,
    }));
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { bio, avatarUrl, socialLinks, category } = parsed.data;

  const updateValues: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) updateValues.bio = bio;
  if (avatarUrl !== undefined) updateValues.avatarUrl = avatarUrl;
  if (socialLinks !== undefined) updateValues.socialLinks = socialLinks;
  if (category !== undefined) updateValues.category = category;

  const [updated] = await db
    .update(users)
    .set({ ...updateValues, updatedAt: new Date() })
    .where(eq(users.id, auth.userId))
    .returning({
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      socialLinks: users.socialLinks,
      category: users.category,
    });

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    bio: updated.bio ?? null,
    avatarUrl: updated.avatarUrl ?? null,
    socialLinks: updated.socialLinks ?? null,
    category: updated.category ?? null,
  });
}
