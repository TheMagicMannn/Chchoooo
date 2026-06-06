/**
 * Lazy user-sync middleware.
 *
 * On the first authenticated request from a Clerk user who doesn't yet have a
 * row in the `users` table, this middleware fetches their details from the
 * Clerk API and inserts the row — no webhook configuration required.
 *
 * An in-memory Set tracks synced userIds so the DB is only queried once per
 * server process per user, keeping the overhead negligible.
 */

import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

// Tracks userIds confirmed to exist in the DB this process lifetime
const syncedIds = new Set<string>();

export async function syncUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req as any).userId as string | undefined;
  if (!userId || syncedIds.has(userId)) {
    next();
    return;
  }

  try {
    // Fast path: check DB first (avoids Clerk API call for existing users)
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (existing.length > 0) {
      syncedIds.add(userId);
      next();
      return;
    }

    // User not in DB — fetch from Clerk and insert
    // clerkClient is a pre-built instance in @clerk/express v2, not a factory function
    const clerkUser = await clerkClient.users.getUser(userId);

    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      "";

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;

    await db
      .insert(usersTable)
      .values({ id: userId, clerkId: userId, email, name: name ?? undefined, plan: "free" })
      .onConflictDoNothing();

    syncedIds.add(userId);
    logger.info({ userId, email }, "User synced from Clerk");
  } catch (err) {
    // Don't block the request if sync fails — log and continue
    logger.warn({ userId, err }, "User sync failed — proceeding anyway");
  }

  next();
}

/** Call when a user's plan changes to evict from the sync cache. */
export function evictSyncedUser(userId: string): void {
  syncedIds.delete(userId);
}
