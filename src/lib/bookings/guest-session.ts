import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { tryGetDb } from "@/lib/db";
import { bookingGuestSessions } from "@/lib/db/schema";
import {
  BOOKING_ACCESS_PENDING_COOKIE,
  BOOKING_SESSION_COOKIE,
  GUEST_SESSION_MINUTES,
} from "@/lib/bookings/constants";
import { generateSessionToken } from "@/lib/bookings/generate-booking-reference";
import { hashSessionToken } from "@/lib/bookings/secrets";
import { log } from "@/lib/logger";
import { auditBookingEvent } from "@/lib/bookings/transition-booking-status";

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

async function setHttpOnlyCookie(name: string, value: string, maxAge: number) {
  const store = await cookies();
  store.set(name, value, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function persistBookingGuestSession(bookingId: string) {
  const db = tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + GUEST_SESSION_MINUTES * 60 * 1000);

  const [session] = await db
    .insert(bookingGuestSessions)
    .values({
      bookingId,
      tokenHash,
      expiresAt,
    })
    .returning();

  log("info", "guest_session_created", { bookingId });
  return { token, expiresAt, session };
}

export async function createBookingGuestSession(bookingId: string) {
  const created = await persistBookingGuestSession(bookingId);
  await setHttpOnlyCookie(
    BOOKING_SESSION_COOKIE,
    created.token,
    GUEST_SESSION_MINUTES * 60,
  );
  return created;
}

export async function readBookingGuestSession() {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const store = await cookies();
  const token = store.get(BOOKING_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return findActiveGuestSession(hashSessionToken(token));
}

export async function findActiveGuestSession(tokenHash: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [session] = await db
    .select()
    .from(bookingGuestSessions)
    .where(
      and(
        eq(bookingGuestSessions.tokenHash, tokenHash),
        isNull(bookingGuestSessions.revokedAt),
        sql`${bookingGuestSessions.expiresAt} > now()`,
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  await db
    .update(bookingGuestSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(bookingGuestSessions.id, session.id));

  return session;
}

export async function revokeBookingGuestSessions(bookingId: string) {
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db
    .update(bookingGuestSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(bookingGuestSessions.bookingId, bookingId),
        isNull(bookingGuestSessions.revokedAt),
      ),
    );
  log("info", "guest_session_revoked", { bookingId });
  await auditBookingEvent({
    actorType: "system",
    action: "guest_session_revoked",
    bookingId,
  });
}

export async function revokeCurrentBookingGuestSession() {
  const db = tryGetDb();
  const store = await cookies();
  const token = store.get(BOOKING_SESSION_COOKIE)?.value;
  if (db && token) {
    await db
      .update(bookingGuestSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(bookingGuestSessions.tokenHash, hashSessionToken(token)),
          isNull(bookingGuestSessions.revokedAt),
        ),
      );
  }
  await clearBookingGuestCookie();
}

export async function clearBookingGuestCookie() {
  await setHttpOnlyCookie(BOOKING_SESSION_COOKIE, "", 0);
}

export async function setBookingAccessPending(input: {
  reference: string;
  email: string;
}) {
  await setHttpOnlyCookie(
    BOOKING_ACCESS_PENDING_COOKIE,
    JSON.stringify(input),
    15 * 60,
  );
}

export async function readBookingAccessPending(): Promise<{
  reference: string;
  email: string;
} | null> {
  const store = await cookies();
  const raw = store.get(BOOKING_ACCESS_PENDING_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { reference?: unknown; email?: unknown };
    if (typeof parsed.reference === "string" && typeof parsed.email === "string") {
      return { reference: parsed.reference, email: parsed.email };
    }
  } catch {
    return null;
  }
  return null;
}

export async function clearBookingAccessPending() {
  await setHttpOnlyCookie(BOOKING_ACCESS_PENDING_COOKIE, "", 0);
}
