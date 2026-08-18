import "server-only";

import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  enquiries,
  enquiryStatusHistory,
  staffProfiles,
  vehicleClasses,
} from "@/lib/db/schema";
import type { enquiryStatusEnum } from "@/lib/db/schema/enums";
import {
  FOLLOW_UP_ENQUIRY_STATUSES,
  OPEN_ENQUIRY_STATUSES,
  type EnquiryServiceType,
  type EnquiryStatus,
} from "@/lib/enquiries/status";

export async function getEnquiryByReference(reference: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      reference: enquiries.reference,
      serviceType: enquiries.serviceType,
      firstName: enquiries.firstName,
      createdAt: enquiries.createdAt,
    })
    .from(enquiries)
    .where(eq(enquiries.reference, reference.trim().toUpperCase()))
    .limit(1);

  return row ?? null;
}

export async function getEnquiryDetail(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      enquiry: enquiries,
      vehicleClassName: vehicleClasses.name,
      assigneeName: staffProfiles.displayName,
    })
    .from(enquiries)
    .leftJoin(vehicleClasses, eq(enquiries.vehicleClassId, vehicleClasses.id))
    .leftJoin(staffProfiles, eq(enquiries.assignedTo, staffProfiles.id))
    .where(eq(enquiries.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const history = await db
    .select()
    .from(enquiryStatusHistory)
    .where(eq(enquiryStatusHistory.enquiryId, id))
    .orderBy(enquiryStatusHistory.createdAt);

  return { ...row, history };
}

export async function listAdminEnquiries(input?: {
  status?: string;
  serviceType?: string;
  assignedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  q?: string;
}) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const conditions = [];

  if (input?.status) {
    conditions.push(
      eq(
        enquiries.status,
        input.status as (typeof enquiryStatusEnum.enumValues)[number],
      ),
    );
  }
  if (input?.serviceType) {
    conditions.push(eq(enquiries.serviceType, input.serviceType as EnquiryServiceType));
  }
  if (input?.assignedTo === "unassigned") {
    conditions.push(sql`${enquiries.assignedTo} IS NULL`);
  } else if (input?.assignedTo) {
    conditions.push(eq(enquiries.assignedTo, input.assignedTo));
  }
  if (input?.createdFrom) {
    conditions.push(gte(enquiries.createdAt, new Date(`${input.createdFrom}T00:00:00.000Z`)));
  }
  if (input?.createdTo) {
    conditions.push(lte(enquiries.createdAt, new Date(`${input.createdTo}T23:59:59.999Z`)));
  }
  if (input?.q?.trim()) {
    const term = `%${input.q.trim()}%`;
    conditions.push(
      or(
        ilike(enquiries.reference, term),
        ilike(enquiries.firstName, term),
        ilike(enquiries.lastName, term),
        ilike(enquiries.email, term),
        ilike(enquiries.phone, term),
        ilike(enquiries.companyName, term),
      ),
    );
  }

  return db
    .select({
      id: enquiries.id,
      reference: enquiries.reference,
      serviceType: enquiries.serviceType,
      status: enquiries.status,
      firstName: enquiries.firstName,
      lastName: enquiries.lastName,
      email: enquiries.email,
      pickupAt: enquiries.pickupAt,
      createdAt: enquiries.createdAt,
      assignedTo: enquiries.assignedTo,
      assigneeName: staffProfiles.displayName,
    })
    .from(enquiries)
    .leftJoin(staffProfiles, eq(enquiries.assignedTo, staffProfiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(100);
}

export async function getEnquiriesDashboard() {
  const db = tryGetDb();
  if (!db) {
    return {
      newCount: 0,
      awaitingResponseCount: 0,
      quotedCount: 0,
      followUpCount: 0,
      priority: [] as Array<Record<string, unknown>>,
    };
  }

  const [newCount, awaitingResponseCount, quotedCount, followUpCount, priority] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(eq(enquiries.status, "new")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(inArray(enquiries.status, ["new", "in_review", "awaiting_customer"])),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(eq(enquiries.status, "quoted")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(enquiries)
        .where(inArray(enquiries.status, FOLLOW_UP_ENQUIRY_STATUSES)),
      db
        .select({
          id: enquiries.id,
          reference: enquiries.reference,
          serviceType: enquiries.serviceType,
          status: enquiries.status,
          firstName: enquiries.firstName,
          lastName: enquiries.lastName,
          createdAt: enquiries.createdAt,
          assignedTo: enquiries.assignedTo,
        })
        .from(enquiries)
        .where(
          and(
            inArray(enquiries.status, OPEN_ENQUIRY_STATUSES),
            sql`${enquiries.assignedTo} IS NULL`,
          ),
        )
        .orderBy(enquiries.createdAt)
        .limit(8),
    ]);

  return {
    newCount: newCount[0]?.count ?? 0,
    awaitingResponseCount: awaitingResponseCount[0]?.count ?? 0,
    quotedCount: quotedCount[0]?.count ?? 0,
    followUpCount: followUpCount[0]?.count ?? 0,
    priority,
  };
}

export async function listActiveVehicleClassOptions() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({ id: vehicleClasses.id, name: vehicleClasses.name })
    .from(vehicleClasses)
    .where(eq(vehicleClasses.active, true))
    .orderBy(vehicleClasses.name);
}

export async function listAssignableStaff() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: staffProfiles.id,
      displayName: staffProfiles.displayName,
      role: staffProfiles.role,
    })
    .from(staffProfiles)
    .where(eq(staffProfiles.active, true))
    .orderBy(staffProfiles.displayName);
}

export function formatEnquiryAge(createdAt: Date): string {
  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) {
    return `${Math.max(minutes, 1)} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  return `${days} days ago`;
}

export function isQuoteExpired(validUntil: Date | null | undefined): boolean {
  if (!validUntil) {
    return false;
  }
  return validUntil.getTime() < Date.now();
}

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return (
    value === "new" ||
    value === "in_review" ||
    value === "contacted" ||
    value === "awaiting_customer" ||
    value === "quoted" ||
    value === "accepted" ||
    value === "declined" ||
    value === "closed"
  );
}

export function isEnquiryServiceType(value: string): value is EnquiryServiceType {
  return (
    value === "chauffeur" ||
    value === "airport_transfer" ||
    value === "long_term" ||
    value === "corporate" ||
    value === "events" ||
    value === "multi_city" ||
    value === "general"
  );
}
