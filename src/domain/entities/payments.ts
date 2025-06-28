import { v4 as uuidv4 } from 'uuid';
import { Money } from '@domain/value-objects/money';
import { IdempotencyKey } from '@domain/value-objects/idempotency-key';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class Payment {
  private id: string;
  private userId: string;
  private orderId: string;
  private amount: Money;
  private status: PaymentStatus;
  private idempotencyKey: IdempotencyKey;
  private paymentGateway: 'stripe' | 'paypal';
  private transactionId?: string;
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    userId: string,
    orderId: string,
    amount: Money,
    idempotencyKey: IdempotencyKey,
    paymentGateway: 'stripe' | 'paypal',
  ) {
    this.id = uuidv4();
    this.userId = userId;
    this.orderId = orderId;
    this.amount = amount;
    this.status = PaymentStatus.PENDING;
    this.idempotencyKey = idempotencyKey;
    this.paymentGateway = paymentGateway;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.validate();
  }

  static create(
    userId: string,
    orderId: string,
    amount: Money,
    idempotencyKey: IdempotencyKey,
    paymentGateway: 'stripe' | 'paypal',
  ): Payment {
    if (!userId || !orderId) {
      throw new Error('User ID and Order ID are required');
    }
    if (!['stripe', 'paypal'].includes(paymentGateway)) {
      throw new Error('Invalid payment gateway');
    }
    return new Payment(userId, orderId, amount, idempotencyKey, paymentGateway);
  }

  private validate(): void {
    if (this.amount.getAmount() <= 0) {
      throw new Error('Amount must be greater than zero');
    }
  }

  succeed(transactionId: string): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Payment can only succeed from PENDING status');
    }
    this.status = PaymentStatus.SUCCESS;
    this.transactionId = transactionId;
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Payment can only fail from PENDING status');
    }
    this.status = PaymentStatus.FAILED;
    this.updatedAt = new Date();
  }

  // Getters (immutable access)
  getId(): string {
    return this.id;
  }
  getUserId(): string {
    return this.userId;
  }
  getOrderId(): string {
    return this.orderId;
  }
  getAmount(): Money {
    return this.amount;
  }
  getStatus(): PaymentStatus {
    return this.status;
  }
  getIdempotencyKey(): IdempotencyKey {
    return this.idempotencyKey;
  }
  getPaymentGateway(): 'stripe' | 'paypal' {
    return this.paymentGateway;
  }
  getTransactionId(): string | undefined {
    return this.transactionId;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Used for persistence layer to set private fields (e.g., after loading from DB)
  setId(id: string): void {
    this.id = id;
  }
  setStatus(status: PaymentStatus): void {
    this.status = status;
  }
  setTransactionId(transactionId: string): void {
    this.transactionId = transactionId;
  }
  setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }
  setUpdatedAt(updatedAt: Date): void {
    this.updatedAt = updatedAt;
  }
}
