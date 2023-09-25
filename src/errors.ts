export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export class UnexpectedError extends Error {
  constructor(message: string) {
    super();
    this.name = 'Unexpected Error' as const;
    this.message = message;
  }
}

export const isUnexpectedError = (error: unknown): error is UnexpectedError => {
  return error instanceof Error && error instanceof UnexpectedError;
};

export class DomainInvariantViolationError extends Error {
  constructor(message: string) {
    super();
    this.name = 'Domain Invariant Violation' as const;
    this.message = message;
  }
}

export const isDomainInvariantViolation = (
  error: unknown,
): error is DomainInvariantViolationError => {
  return (
    error instanceof Error && error instanceof DomainInvariantViolationError
  );
};
