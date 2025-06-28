export abstract class RedisClient {
  abstract set(key: string, value: string, ttl?: number): Promise<void>;
  abstract get(key: string): Promise<string | null>;
  abstract del(key: string): Promise<void>;
  abstract lock(key: string, ttl: number): Promise<boolean>;
  abstract unlock(key: string): Promise<void>;
}
