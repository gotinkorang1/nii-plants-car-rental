import { pgEnum } from "drizzle-orm/pg-core";

export const staffRoleEnum = pgEnum("staff_role", [
  "administrator",
  "reservations",
  "fleet",
  "finance",
  "content_editor",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "branch",
  "airport",
  "city",
  "pickup_point",
  "service_area",
]);

export const transmissionTypeEnum = pgEnum("transmission_type", [
  "automatic",
  "manual",
]);

export const fuelTypeEnum = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "rented",
  "maintenance",
  "inactive",
]);

export const extraPricingTypeEnum = pgEnum("extra_pricing_type", [
  "once",
  "per_day",
]);

export const promotionTypeEnum = pgEnum("promotion_type", [
  "percentage",
  "fixed",
]);

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
  "staff",
  "system",
  "customer",
]);

export const allocationTypeEnum = pgEnum("allocation_type", [
  "booking",
  "maintenance",
  "manual_block",
]);

export const allocationStatusEnum = pgEnum("allocation_status", [
  "hold",
  "confirmed",
  "ready",
  "checked_out",
  "completed",
  "expired",
  "cancelled",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "held",
  "payment_pending",
  "confirmed",
  "ready",
  "checked_out",
  "completed",
  "cancelled",
  "expired",
  "under_review",
  "rejected",
]);

export const bookingHistoryActorTypeEnum = pgEnum("booking_history_actor_type", [
  "system",
  "customer",
  "staff",
  "payment",
]);

export const paymentPurposeEnum = pgEnum("payment_purpose", [
  "reservation",
  "full_rental",
  "balance",
  "security_deposit",
  "additional_charge",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "provider_pending",
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

export const inspectionTypeEnum = pgEnum("inspection_type", ["pickup", "return"]);

export const fuelLevelEnum = pgEnum("fuel_level", [
  "empty",
  "quarter",
  "half",
  "three_quarters",
  "full",
]);

export const inspectionConditionEnum = pgEnum("inspection_condition", [
  "good",
  "attention_required",
  "damage_detected",
]);

export const inspectionPhotoCategoryEnum = pgEnum("inspection_photo_category", [
  "front",
  "rear",
  "left",
  "right",
  "interior",
  "dashboard",
  "odometer",
  "fuel",
  "damage",
  "other",
]);

export const securityDepositStatusEnum = pgEnum("security_deposit_status", [
  "required",
  "collected",
  "partially_collected",
  "held",
  "released",
  "retained",
  "not_required",
]);

export const securityDepositCollectionMethodEnum = pgEnum(
  "security_deposit_collection_method",
  ["cash", "mobile_money", "bank_transfer", "card", "other"],
);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "scheduled_service",
  "repair",
  "tyre",
  "battery",
  "bodywork",
  "inspection",
  "other",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const enquiryServiceTypeEnum = pgEnum("enquiry_service_type", [
  "chauffeur",
  "airport_transfer",
  "long_term",
  "corporate",
  "events",
  "multi_city",
  "general",
]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "in_review",
  "contacted",
  "awaiting_customer",
  "quoted",
  "accepted",
  "declined",
  "closed",
]);

export const enquirySourceEnum = pgEnum("enquiry_source", [
  "website",
  "admin",
  "phone",
  "whatsapp",
  "walk_in",
  "other",
]);
