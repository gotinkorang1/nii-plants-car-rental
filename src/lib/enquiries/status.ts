import {
  enquiryServiceTypeEnum,
  enquiryStatusEnum,
} from "@/lib/db/schema/enums";

export type EnquiryServiceType = (typeof enquiryServiceTypeEnum.enumValues)[number];
export type EnquiryStatus = (typeof enquiryStatusEnum.enumValues)[number];

export const ENQUIRY_STATUSES = enquiryStatusEnum.enumValues;

export const ENQUIRY_SERVICE_TYPES = enquiryServiceTypeEnum.enumValues;

export const ENQUIRY_SERVICE_LABELS: Record<EnquiryServiceType, string> = {
  chauffeur: "Chauffeur service",
  airport_transfer: "Airport transfer",
  long_term: "Long-term rental",
  corporate: "Corporate mobility",
  events: "Events / group transport",
  multi_city: "Multi-city / custom transport",
  general: "General enquiry",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  in_review: "In review",
  contacted: "Contacted",
  awaiting_customer: "Awaiting customer",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
  closed: "Closed",
};

const ALLOWED_TRANSITIONS: Record<EnquiryStatus, readonly EnquiryStatus[]> = {
  new: ["in_review", "contacted", "closed"],
  in_review: ["contacted", "quoted", "accepted", "declined", "closed"],
  contacted: ["awaiting_customer", "quoted", "accepted", "declined", "closed"],
  awaiting_customer: ["contacted", "quoted", "closed"],
  quoted: ["accepted", "declined", "closed"],
  accepted: ["closed"],
  declined: ["closed"],
  closed: [],
};

export function canTransitionEnquiryStatus(
  from: EnquiryStatus,
  to: EnquiryStatus,
): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertEnquiryTransition(from: EnquiryStatus, to: EnquiryStatus) {
  if (!canTransitionEnquiryStatus(from, to)) {
    throw new Error(`Enquiry status cannot move from ${from} to ${to}.`);
  }
}

export function enquiryStatusLabel(status: EnquiryStatus): string {
  return ENQUIRY_STATUS_LABELS[status];
}

export function enquiryServiceLabel(serviceType: EnquiryServiceType): string {
  return ENQUIRY_SERVICE_LABELS[serviceType];
}

export const OPEN_ENQUIRY_STATUSES: EnquiryStatus[] = [
  "new",
  "in_review",
  "contacted",
  "awaiting_customer",
  "quoted",
  "accepted",
];

export const FOLLOW_UP_ENQUIRY_STATUSES: EnquiryStatus[] = [
  "new",
  "in_review",
  "contacted",
  "awaiting_customer",
];
