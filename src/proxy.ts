import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// The session middleware's only effect is protecting /admin routes (its sole
// action, isProtectedAdminPath, is scoped entirely to /admin). Running it on
// every request made a Supabase auth call on all public pages, API routes and
// webhooks — wasted compute on every visitor and crawler hit. Scope it to the
// admin area only, so public/cached pages serve with no middleware invocation.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
