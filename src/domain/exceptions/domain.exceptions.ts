export abstract class DomainException extends Error {
  abstract errorCode: string;
  constructor(message: string) {
    super(message);
    this.name = 'DOMAIN_EXCEPTION';
  }
  abstract serializeError(): { message: string; field?: string }[];
}

export class UserNotFoundException extends DomainException {
  errorCode: string = 'USER_NOT_FOUND_EXCEPTION';
  constructor(message?: string) {
    super(message || `User your are requested not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class OrderNotFoundException extends DomainException {
  errorCode: string = 'ORDER_NOT_FOUND_EXCEPTION';
  constructor(message?: string) {
    super(message || `Order your have requested not found`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class IdempotencyException extends DomainException {
  errorCode: string = 'IDEMPOTENCY_EXCEPTION';
  constructor(message?: string) {
    super(message || `Idempotency exception`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class PaymentFailureException extends DomainException {
  errorCode: string = 'PAYMENT_FAILURE_EXCEPTION';
  constructor(message?: string) {
    super(message || `Error happened while processing payment`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
export class RefundFailedException extends DomainException {
  errorCode: string = 'REFUND_FAILURE_EXCEPTION';
  constructor(message?: string) {
    super(message || `Error happened while processing refund request`);
  }

  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}
