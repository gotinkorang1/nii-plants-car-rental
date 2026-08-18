import { config } from "dotenv";
import "@testing-library/jest-dom/vitest";

config({ path: ".env.local" });
config();

process.env.PAYSTACK_MOCK ??= "1";
process.env.EMAIL_DEV_OUTBOX ??= "1";
