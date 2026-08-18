import type { NextConfig } from "next";

const publicStoragePath = "/storage/v1/object/public/**";

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: publicStoragePath,
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    const protocol = parsed.protocol === "http:" ? "http" : "https";
    remotePatterns.push({
      protocol,
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: publicStoragePath,
    });
  } catch {
    // Invalid NEXT_PUBLIC_SUPABASE_URL is handled by env validation at runtime.
  }
}

function buildContentSecurityPolicy(isDev: boolean): string {
  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.paystack.co",
  ];

  if (isDev) {
    connectSrc.push("ws:", "http://127.0.0.1:*", "http://localhost:*");
  }

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.paystack.com",
    "object-src 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "drizzle-orm"],
  images: {
    remotePatterns,
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = buildContentSecurityPolicy(isDev);

    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
