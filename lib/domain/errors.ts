export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "DOMAIN_ERROR",
  ) {
    super(message);
  }
}

export function assertDomain(
  condition: unknown,
  message: string,
  status = 400,
  code = "INVALID_OPERATION",
): asserts condition {
  if (!condition) throw new DomainError(message, status, code);
}
