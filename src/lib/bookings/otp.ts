import "server-only";

import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { BookingError } from "@/lib/booking/errors";
import {
  GENERIC_OTP_REQUEST_MESSAGE,
  GENERIC_OTP_SEND_FAILED_MESSAGE,
  GENERIC_OTP_VERIFY_MESSAGE,
  OTP_ATTEMPT_LIMIT,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_REQUEST_COOLDOWN_SECONDS,
} from "@/lib/bookings/constants";
import { generateOtpDigits } from "@/lib/bookings/generate-booking-reference";
import { sendBookingAccessCode } from "@/lib/bookings/notify";
import { hashOtp, hashesMatch } from "@/lib/bookings/secrets";
import { tryGetDb } from "@/lib/db";
import { bookingAccessCodes, bookings, customers } from "@/lib/db/schema";
import { log } from "@/lib/logger";

export { GENERIC_OTP_REQUEST_MESSAGE };

export async function requestBookingAccessOtp(input: {
  reference: string;
  email: string;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const db = tryGetDb();
  const reference = input.reference.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();

  log("info", "otp_requested", { referenceLength: reference.length });

  if (!db) {
    return { ok: true, message: GENERIC_OTP_REQUEST_MESSAGE };
  }

  const [match] = await db
    .select({
      bookingId: bookings.id,
      reference: bookings.reference,
      firstName: customers.firstName,
      email: customers.email,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        eq(bookings.reference, reference),
        sql`lower(btrim(${customers.email})) = ${email}`,
      ),
    )
    .limit(1);

  if (!match) {
    return { ok: true, message: GENERIC_OTP_REQUEST_MESSAGE };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({
      id: bookingAccessCodes.id,
      createdAt: bookingAccessCodes.createdAt,
    })
    .from(bookingAccessCodes)
    .where(
      and(
        eq(bookingAccessCodes.bookingId, match.bookingId),
        gte(bookingAccessCodes.createdAt, hourAgo),
      ),
    )
    .orderBy(desc(bookingAccessCodes.createdAt));

  const newest = recent[0];
  if (
    newest &&
    Date.now() - newest.createdAt.getTime() < OTP_REQUEST_COOLDOWN_SECONDS * 1000
  ) {
    return { ok: true, message: GENERIC_OTP_REQUEST_MESSAGE };
  }
  if (recent.length >= OTP_MAX_REQUESTS_PER_HOUR) {
    return { ok: true, message: GENERIC_OTP_REQUEST_MESSAGE };
  }

  const code = generateOtpDigits(6);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const codeHash = hashOtp({
    bookingId: match.bookingId,
    emailNormalized: email,
    code,
  });

  await db
    .update(bookingAccessCodes)
    .set({ expiresAt: new Date() })
    .where(
      and(
        eq(bookingAccessCodes.bookingId, match.bookingId),
        isNull(bookingAccessCodes.usedAt),
        sql`${bookingAccessCodes.expiresAt} > now()`,
      ),
    );

  await db.insert(bookingAccessCodes).values({
    bookingId: match.bookingId,
    emailNormalized: email,
    codeHash,
    expiresAt,
  });

  const sent = await sendBookingAccessCode({
    email,
    firstName: match.firstName,
    reference: match.reference,
    code,
  });

  if (!sent.ok) {
    log("warn", "otp_failed", { reason: "email_send_failed", bookingId: match.bookingId });
    return { ok: false, message: GENERIC_OTP_SEND_FAILED_MESSAGE };
  }

  return { ok: true, message: GENERIC_OTP_REQUEST_MESSAGE };
}

export async function verifyBookingAccessOtp(input: {
  reference: string;
  email: string;
  code: string;
}): Promise<{ bookingId: string; reference: string }> {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError("OTP_INVALID", GENERIC_OTP_VERIFY_MESSAGE);
  }

  const reference = input.reference.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();

  const [match] = await db
    .select({
      bookingId: bookings.id,
      reference: bookings.reference,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        eq(bookings.reference, reference),
        sql`lower(btrim(${customers.email})) = ${email}`,
      ),
    )
    .limit(1);

  if (!match) {
    log("warn", "otp_failed", { reason: "no_match" });
    throw new BookingError("OTP_INVALID", GENERIC_OTP_VERIFY_MESSAGE);
  }

  const [record] = await db
    .select()
    .from(bookingAccessCodes)
    .where(
      and(
        eq(bookingAccessCodes.bookingId, match.bookingId),
        eq(bookingAccessCodes.emailNormalized, email),
        isNull(bookingAccessCodes.usedAt),
      ),
    )
    .orderBy(desc(bookingAccessCodes.createdAt))
    .limit(1);

  if (!record) {
    log("warn", "otp_failed", { reason: "missing_code", bookingId: match.bookingId });
    throw new BookingError("OTP_INVALID", GENERIC_OTP_VERIFY_MESSAGE);
  }

  if (record.attemptCount >= OTP_ATTEMPT_LIMIT) {
    log("warn", "otp_failed", { reason: "locked", bookingId: match.bookingId });
    throw new BookingError(
      "OTP_LOCKED",
      "Too many attempts. Request a new verification code.",
    );
  }

  const nextAttempts = record.attemptCount + 1;
  await db
    .update(bookingAccessCodes)
    .set({ attemptCount: nextAttempts })
    .where(eq(bookingAccessCodes.id, record.id));

  if (record.expiresAt.getTime() <= Date.now()) {
    log("warn", "otp_failed", { reason: "expired", bookingId: match.bookingId });
    throw new BookingError("OTP_EXPIRED", GENERIC_OTP_VERIFY_MESSAGE);
  }

  const expected = hashOtp({
    bookingId: match.bookingId,
    emailNormalized: email,
    code,
  });
  if (!hashesMatch(record.codeHash, expected)) {
    if (nextAttempts >= OTP_ATTEMPT_LIMIT) {
      await db
        .update(bookingAccessCodes)
        .set({ expiresAt: new Date() })
        .where(eq(bookingAccessCodes.id, record.id));
      log("warn", "otp_failed", { reason: "locked", bookingId: match.bookingId });
      throw new BookingError(
        "OTP_LOCKED",
        "Too many attempts. Request a new verification code.",
      );
    }
    log("warn", "otp_failed", { reason: "mismatch", bookingId: match.bookingId });
    throw new BookingError("OTP_INVALID", GENERIC_OTP_VERIFY_MESSAGE);
  }

  await db
    .update(bookingAccessCodes)
    .set({ usedAt: new Date() })
    .where(eq(bookingAccessCodes.id, record.id));

  log("info", "otp_verified", { bookingId: match.bookingId });
  return { bookingId: match.bookingId, reference: match.reference };
}
