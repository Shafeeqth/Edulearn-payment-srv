import { AppConfigService } from '@infrastructure/config/config.service';
import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';
import { RedisClientImpl } from './redis.service';
import { RedisClient } from '@domain/interfaces/redis.interface';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (...args: unknown[]) => ({
        config: {
          url: (args[0] as AppConfigService).redisUrl,
          maxRetriesPerRequest: 3,
          enableAutoPipelining: true,
          connectTimeout: 5000,
          keepAlive: 1000,
          maxLoadingRetryTime: 10000,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          poolOptions: {
            min: (args[0] as AppConfigService).redisMinConnections,
            max: (args[0] as AppConfigService).redisMaxConnections,
          },
        },
      }),
    }),
  ],
  providers: [{ provide: RedisClient, useClass: RedisClientImpl }],
  exports: [RedisClient],
})
export class RedisModule {}
