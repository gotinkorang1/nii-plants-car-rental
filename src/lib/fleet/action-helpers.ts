export type ActionState = {
  error?: string;
  success?: string;
} | null;

export function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function formCheckbox(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true";
}

export function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: string; message?: string };
  return (
    record.code === "23505" ||
    (typeof record.message === "string" &&
      record.message.toLowerCase().includes("duplicate"))
  );
}

export function uniqueMessage(error: unknown, fallback: string) {
  if (!isUniqueViolation(error)) {
    return fallback;
  }

  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("slug")) {
    return "That slug is already in use.";
  }
  if (message.includes("name")) {
    return "That name is already in use.";
  }
  if (message.includes("code")) {
    return "That promo code is already in use.";
  }
  if (message.includes("internal_code")) {
    return "That internal code is already in use.";
  }
  if (message.includes("registration_number")) {
    return "That registration number is already in use.";
  }

  return fallback;
}
