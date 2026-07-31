import type { NextRequest } from 'next/server';

/**
 * Authorize a cron invocation.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. The legacy
 * `x-cron-secret` header and `?secret=` query param are still accepted so
 * manual triggers and any existing external schedulers keep working.
 *
 * Returns true when CRON_SECRET is unset, which keeps local development
 * frictionless — set it in production so these routes aren't publicly callable.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const legacyHeader = req.headers.get('x-cron-secret');
  const queryParam = req.nextUrl.searchParams.get('secret');

  return [bearer, legacyHeader, queryParam].some((v) => v === expected);
}
