import { describe, expect, it } from "vitest";

import { generateEnquiryReference } from "@/lib/enquiries/generate-enquiry-reference";
import {
  canTransitionEnquiryStatus,
  ENQUIRY_SERVICE_TYPES,
} from "@/lib/enquiries/status";
import {
  normalizePublicEnquiryInput,
  publicEnquiryBaseSchema,
  validatePublicEnquiryPayload,
} from "@/lib/enquiries/validation";
import { normalizeEmail, normalizePhone } from "@/lib/bookings/normalize-customer";

describe("enquiry reference generation", () => {
  it("generates NP-ENQ references with month segment", () => {
    const reference = generateEnquiryReference(new Date("2026-08-18T12:00:00Z"));
    expect(reference).toMatch(/^NP-ENQ-2608-[A-Z0-9]{4}$/);
  });

  it("generates unique references", () => {
    const refs = new Set(Array.from({ length: 20 }, () => generateEnquiryReference()));
    expect(refs.size).toBe(20);
  });
});

describe("enquiry status transitions", () => {
  it("allows new to contacted", () => {
    expect(canTransitionEnquiryStatus("new", "contacted")).toBe(true);
  });

  it("blocks closed to contacted", () => {
    expect(canTransitionEnquiryStatus("closed", "contacted")).toBe(false);
  });

  it("allows quoted to accepted", () => {
    expect(canTransitionEnquiryStatus("quoted", "accepted")).toBe(true);
  });
});

describe("public enquiry validation", () => {
  const base = {
    serviceType: "general",
    firstName: "Ama",
    lastName: "Mensah",
    email: "ama@example.com",
    phone: "0241234567",
  };

  it("accepts general enquiries", () => {
    const parsed = validatePublicEnquiryPayload(base);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid service types", () => {
    const parsed = validatePublicEnquiryPayload({
      ...base,
      serviceType: "free_supercar",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects tampered status fields via base schema stripping", () => {
    const parsed = publicEnquiryBaseSchema.safeParse({
      ...base,
      status: "accepted",
      quotedAmount: 100,
      reference: "NP-ENQ-HACK",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("status" in parsed.data).toBe(false);
      expect("quotedAmount" in parsed.data).toBe(false);
    }
  });

  it("requires chauffeur pickup details", () => {
    const parsed = validatePublicEnquiryPayload({
      ...base,
      serviceType: "chauffeur",
      passengerCount: 2,
    });
    expect(parsed.success).toBe(false);
  });

  it("normalizes customer contact fields", () => {
    const normalized = normalizePublicEnquiryInput({
      serviceType: "general",
      firstName: "  Ama ",
      lastName: "Mensah",
      email: " AMA@Example.COM ",
      phone: "+233 24 123 4567",
      customerMessage: undefined,
      vehicleClassId: undefined,
    });
    expect(normalized.email).toBe(normalizeEmail(" AMA@Example.COM "));
    expect(normalized.phone).toBe(normalizePhone("+233 24 123 4567"));
  });

  it("covers all service type enums", () => {
    expect(ENQUIRY_SERVICE_TYPES).toContain("multi_city");
    expect(ENQUIRY_SERVICE_TYPES.length).toBe(7);
  });
});
