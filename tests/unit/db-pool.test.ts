import { describe, expect, it } from "vitest";

import { resolvePostgresClientOptions } from "@/lib/db/postgres-options";

describe("postgres client pool options", () => {
  it("uses a small session pool for direct Postgres URLs", () => {
    expect(
      resolvePostgresClientOptions(
        "postgres://postgres:postgres@127.0.0.1:54322/postgres",
        "",
      ),
    ).toEqual({
      max: 5,
      prepare: true,
      idle_timeout: 20,
    });
  });

  it("disables prepared statements on the transaction pooler and allows concurrent queries", () => {
    expect(
      resolvePostgresClientOptions(
        "postgres://postgres.abc:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
        "",
      ),
    ).toEqual({
      max: 5,
      prepare: false,
      idle_timeout: 20,
    });
  });

  it("honors an explicit DATABASE_POOL_MAX of 1 on the transaction pooler", () => {
    expect(
      resolvePostgresClientOptions(
        "postgres://postgres.abc:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
        "1",
      ).max,
    ).toBe(1);
  });

  it("caps an explicit DATABASE_POOL_MAX", () => {
    expect(
      resolvePostgresClientOptions(
        "postgres://postgres:postgres@127.0.0.1:54322/postgres",
        "25",
      ).max,
    ).toBe(10);
  });
});
