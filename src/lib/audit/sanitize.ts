const sensitiveKeyPattern =
  /(secret|password|token|key|authorization|cookie|otp|payload)/i;

export function sanitizeAuditMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (sensitiveKeyPattern.test(key)) {
        return [key, "[redacted]"];
      }

      return [key, value];
    }),
  );
}
