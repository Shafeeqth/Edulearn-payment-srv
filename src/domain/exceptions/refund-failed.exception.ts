export class RefundFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundFailedException';
  }
}
