import { config } from "dotenv";
import "@testing-library/jest-dom/vitest";

config({ path: ".env.local" });
config();

process.env.PAYSTACK_MOCK ??= "1";
process.env.EMAIL_DEV_OUTBOX ??= "1";

// Give each worker its own capture file. Test files run in parallel and the
// outbox is a read-modify-write JSON blob, so a shared path loses entries.
process.env.EMAIL_OUTBOX_WORKER = `worker-${process.env.VITEST_WORKER_ID ?? "0"}`;
