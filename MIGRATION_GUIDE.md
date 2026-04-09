# Backr Database Migration Guide

This guide ensures that the production database stays in sync with the application code to prevent outages.

## The Problem
Running code that expects certain database columns (e.g., `referral_source`, `platform_fee`) when those columns don't exist yet will cause a **500 Internal Server Error** on the platform.

## The Foolproof Workflow

### 1. Daily Development
When you add a new feature that requires a database change:
1. Update the schema files in `@/db/schema/`.
2. Run `npm run db:push` to sync your local database.

### 2. Pre-Deployment (CRITICAL)
Before you push your code to production, you must ensure the production database is ready.

> [!IMPORTANT]
> **Always run the migration BEFORE or AT THE SAME TIME as the code deployment.**

**Option A: Automated Sync (Recommended)**
Run this command from your terminal:
```bash
npm run db:push
```
*Note: Ensure your `.env` file is pointing to the production database URL when doing this.*

**Option B: Manual SQL Patch**
If you cannot run `db:push`, use the Drizzle Studio to inspect changes:
```bash
npx drizzle-kit studio
```

## Maintenance Tools

### Payment Reconciliation
If a payment is "stuck" or a webhook was missed, the platform now has an automated fallback. However, you can trigger it manually:
- **Endpoint**: `/api/cron`
- **Security**: Requires an `Authorization: Bearer <CRON_SECRET>` header.

### Admin Tools
Any custom administrative tools are now protected by an `ADMIN_SECRET`.
- **Header Required**: `x-admin-secret: <YOUR_SECRET>`
