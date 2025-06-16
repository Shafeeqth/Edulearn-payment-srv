export class IdempotencyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyException';
  }
}
