export class UnauthorizedError extends Error {
  readonly code = "unauthenticated" as const;

  constructor(message = "Staff authentication is required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "forbidden" as const;

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
