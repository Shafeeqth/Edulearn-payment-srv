import { Refund } from '@domain/entities/refund';

export abstract class RefundRepository {
  abstract save(refund: Refund): Promise<void>;
  abstract findById(id: string): Promise<Refund | null>;
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<Refund | null>;
  abstract update(refund: Refund): Promise<void>;
}
