import "server-only";

import { randomUUID } from "node:crypto";

import { serverEnv } from "@/lib/env.server";
import { isProductionRuntime } from "@/lib/env/runtime-environment";
import { appendDevOutbox } from "@/lib/email/dev-outbox";
import type { RenderedEmail } from "@/lib/email/templates";
import { log } from "@/lib/logger";

export type SendEmailInput = {
  to: string;
  email: RenderedEmail;
  otp?: string;
};

export type SendEmailResult = {
  ok: boolean;
  transport: "resend" | "outbox";
  error?: string;
};

function resendEnabled() {
  if (process.env.VITEST) {
    return false;
  }
  if (isProductionRuntime()) {
    return Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM);
  }
  return Boolean(serverEnv.RESEND_API_KEY && process.env.EMAIL_DEV_OUTBOX !== "1");
}

function captureDevOutbox() {
  if (isProductionRuntime()) {
    return false;
  }
  return Boolean(
    process.env.VITEST ||
      process.env.EMAIL_DEV_OUTBOX === "1" ||
      !serverEnv.RESEND_API_KEY,
  );
}

function fromAddress() {
  if (isProductionRuntime()) {
    if (!serverEnv.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is required in production.");
    }
    return serverEnv.EMAIL_FROM;
  }
  return serverEnv.EMAIL_FROM ?? "Nii Plants Car Rental <noreply@localhost>";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (isProductionRuntime() && !serverEnv.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required for production email delivery.");
  }

  const payload = {
    to: input.to,
    subject: input.email.subject,
    template: input.email.template,
    text: input.email.text,
    createdAt: new Date().toISOString(),
    otp: input.otp,
  };

  if (resendEnabled()) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress(),
          to: [input.to],
          subject: input.email.subject,
          text: input.email.text,
          html: input.email.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const detail = await response.text();
        log("error", "email_send_failed", {
          template: input.email.template,
          status: response.status,
          detail: detail.slice(0, 200),
        });
        return { ok: false, transport: "resend", error: "provider_rejected" };
      }
      if (captureDevOutbox()) {
        await appendDevOutbox({ id: randomUUID(), ...payload });
      }
      return { ok: true, transport: "resend" };
    } catch (error) {
      log("error", "email_send_failed", {
        template: input.email.template,
        message: error instanceof Error ? error.message : "unknown",
      });
      return { ok: false, transport: "resend", error: "provider_unavailable" };
    }
  }

  await appendDevOutbox({
    id: randomUUID(),
    ...payload,
  });
  log("info", "email_outbox_recorded", { template: input.email.template });
  return { ok: true, transport: "outbox" };
}
