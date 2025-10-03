import { Injectable } from '@nestjs/common';
import { RedisService as NestRedisService } from '@liaoliaots/nestjs-redis';
import { RedisClient } from '@domain/interfaces/redis.interface';
import { Redis } from 'ioredis';
import { TracingService } from '@infrastructure/observability/tracing/trace.service';
import { LoggingService } from '@infrastructure/observability/logging/logging.service';

@Injectable()
export class RedisClientImpl implements RedisClient {
  private readonly client: Redis;

  constructor(
    private readonly redisService: NestRedisService,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
  ) {
    this.client = this.redisService.getOrThrow();
    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`, {
        error,
        ctx: 'RedisClient',
      });
    });
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    return await this.tracer.startActiveSpan('RedisClient.set', async (span) => {
      span.setAttribute('cache.key', key);
      try {
        if (ttl) {
          await this.client.set(key, value, 'EX', ttl);
        } else {
          await this.client.set(key, value);
        }
        this.logger.log(`Set key ${key} in Redis`, { ctx: 'RedisClient' });
      } catch (error: any) {
        this.logger.error(`Failed to set key ${key}: ${error.message}`, {
          error,
          ctx: 'RedisClient',
        });
        throw error;
      }
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.tracer.startActiveSpan('RedisClient.get', async (span) => {
      span.setAttribute('cache.key', key);
      try {
        const value = await this.client.get(key);
        this.logger.log(`Retrieved key ${key} from Redis`, {
          ctx: 'RedisClient',
        });
        return value;
      } catch (error: any) {
        this.logger.error(`Failed to get key ${key}: ${error.message}`, {
          error,
          ctx: 'RedisClient',
        });
        throw error;
      }
    });
  }

  async del(key: string): Promise<void> {
    return await this.tracer.startActiveSpan('RedisClient.del', async (span) => {
      span.setAttribute('cache.key', key);
      try {
        await this.client.del(key);
        this.logger.log(`Deleted key ${key} from Redis`, {
          ctx: 'RedisClient',
        });
      } catch (error: any) {
        this.logger.error(`Failed to delete key ${key}: ${error.message}`, {
          error,
          ctx: 'RedisClient',
        });
        throw error;
      }
    });
  }

  async lock(key: string, ttl: number): Promise<boolean> {
    return await this.tracer.startActiveSpan('RedisClient.lock', async (span) => {
      span.setAttribute('cache.key', key);
      try {
        const result = await this.client.set(key, 'locked', 'PX', ttl, 'NX');
        const acquired = result === 'OK';
        this.logger.log(
          `Lock ${acquired ? 'acquired' : 'failed'} for key ${key}`,
          { ctx: 'RedisClient' },
        );
        return acquired;
      } catch (error: any) {
        this.logger.error(
          `Failed to acquire lock for key ${key}: ${error.message}`,
          { error, ctx: 'RedisClient' },
        );
        throw error;
      }
    });
  }

  async unlock(key: string): Promise<void> {
    return await this.tracer.startActiveSpan('RedisClient.unlock', async (span) => {
      span.setAttribute('cache.key', key);
      try {
        await this.client.del(key);
        this.logger.log(`Unlocked key ${key}`, { ctx: 'RedisClient' });
      } catch (error: any) {
        this.logger.error(`Failed to unlock key ${key}: ${error.message}`, {
          error,
          ctx: 'RedisClient',
        });
        throw error;
      }
    });
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.tracer.startActiveSpan('RedisClient.mget', async (span) => {
      span.setAttribute('cache.keys', keys);
      try {
        const values = await this.client.mget(...keys);
        this.logger.log(`Batch retrieved keys ${keys.join(', ')} from Redis`, {
          ctx: 'RedisClient',
        });
        return values;
      } catch (error: any) {
        this.logger.error(`Failed to batch get keys: ${error.message}`, {
          error,
          ctx: 'RedisClient',
        });
        throw error;
      }
    });
  }
}
