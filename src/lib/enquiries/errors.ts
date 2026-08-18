export class EnquiryError extends Error {
  readonly code:
    | "VALIDATION_FAILED"
    | "ENQUIRY_NOT_FOUND"
    | "INVALID_STATUS_TRANSITION"
    | "FORBIDDEN"
    | "RATE_LIMITED"
    | "SPAM_REJECTED"
    | "NOT_CONFIGURED";

  constructor(
    code: EnquiryError["code"],
    message: string,
  ) {
    super(message);
    this.name = "EnquiryError";
    this.code = code;
  }
}

export function enquiryErrorMessage(error: unknown): string {
  if (error instanceof EnquiryError) {
    return error.message;
  }
  return "Something went wrong. Please try again or contact us directly.";
}
