import { NextResponse } from "next/server";

import { createPublicEnquiry } from "@/lib/enquiries/create-enquiry";
import { EnquiryError, enquiryErrorMessage } from "@/lib/enquiries/errors";
import { enquiryServiceLabel } from "@/lib/enquiries/status";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createPublicEnquiry(payload);

    return NextResponse.json({
      ok: true,
      reference: result.reference,
      serviceLabel: enquiryServiceLabel(result.serviceType),
    });
  } catch (error) {
    if (error instanceof EnquiryError) {
      const status =
        error.code === "RATE_LIMITED"
          ? 429
          : error.code === "SPAM_REJECTED"
            ? 400
            : error.code === "VALIDATION_FAILED"
              ? 400
              : 500;

      return NextResponse.json(
        { ok: false, error: enquiryErrorMessage(error) },
        { status },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't send your request. Please try again or contact us directly.",
      },
      { status: 500 },
    );
  }
}
