import { verifyAccessToken } from './jwt';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Master Admin List (replace with actual safe emails in production)
const ADMIN_EMAILS = ['mac@example.com', 'admin@backr.com'];

export async function verifyAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) return false;

  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub as string;

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user && ADMIN_EMAILS.includes(user.email)) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

export async function verifyAdminApi(tokenValue: string | undefined) {
  if (!tokenValue) return false;

  try {
    const payload = verifyAccessToken(tokenValue);
    const userId = payload.sub as string;

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user && ADMIN_EMAILS.includes(user.email)) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
