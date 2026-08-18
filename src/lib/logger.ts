type LogLevel = "info" | "warn" | "error";

const sensitiveKeyPattern =
  /(secret|password|token|key|authorization|cookie|otp|payload)/i;

function sanitize(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (sensitiveKeyPattern.test(key)) {
        return [key, "[redacted]"];
      }

      return [key, value];
    }),
  );
}

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitize(context),
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.info(JSON.stringify(entry));
}
