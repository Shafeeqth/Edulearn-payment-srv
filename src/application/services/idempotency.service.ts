import { Injectable } from '@nestjs/common';
import { RedisClient } from '@domain/interfaces/redis.interface';
import { IdempotencyKey } from '@domain/value-objects/idempotency-key';
import { IdempotencyException } from '@domain/exceptions/idempotency.exception';

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisClient) {}

  async checkIdempotency<T>(
    idempotencyKey: IdempotencyKey,
    callback: () => Promise<T>,
  ): Promise<T> {
    const lockKey = `lock:idempotency:${idempotencyKey.getValue()}`;
    const resultKey = `result:idempotency:${idempotencyKey.getValue()}`;

    // Check if result already exists
    const cachedResult = await this.redis.get(resultKey);
    if (cachedResult) {
      return JSON.parse(cachedResult) as T;
    }

    // Acquire lock
    const lockAcquired = await this.redis.lock(lockKey, 30000); // 30s TTL
    if (!lockAcquired) {
      throw new IdempotencyException('Operation already in progress');
    }

    try {
      // Recheck after acquiring lock to handle race conditions
      const recheckResult = await this.redis.get(resultKey);
      if (recheckResult) {
        return JSON.parse(recheckResult) as T;
      }

      // Execute the callback
      const result = await callback();

      // Cache the result
      await this.redis.set(resultKey, JSON.stringify(result), 86400); // 24h TTL

      return result;
    } finally {
      await this.redis.unlock(lockKey);
    }
  }
}
