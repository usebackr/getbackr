/**
 * Returns true if the given userId is in the ADMIN_USER_IDS environment variable
 * (comma-separated list of UUIDs).
 */
export function isAdmin(userId: string): boolean {
  const raw = process.env.ADMIN_USER_IDS ?? '';
  if (!raw.trim()) return false;
  const adminIds = raw.split(',').map((id) => id.trim());
  return adminIds.includes(userId);
}
