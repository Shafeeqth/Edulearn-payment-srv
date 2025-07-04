import { Injectable } from '@nestjs/common';
import { Money } from '@domain/value-objects/money';
import { IdempotencyKey } from '@domain/value-objects/idempotency-key';
import { PaymentRepository } from '@domain/interfaces/payment-repository.interface';
import { KafkaProducer } from '@domain/interfaces/kafka-producer.interface';
import { RedisClient } from '@domain/interfaces/redis.interface';
import {
  PaymentCreateDto,
  PaymentGateway,
} from '@application/dtos/payment-create.dto';
import { IdempotencyException } from '@domain/exceptions/idempotency.exception';
import { retry } from 'ts-retry-promise';
import { LoggingService } from '@infrastructure/observability/logging/logging.service';
import { TracingService } from '@infrastructure/observability/tracing/trace.service';
import { MetricsService } from '@infrastructure/observability/metrics/metrics.service';
import { Payment, PaymentStatus } from '@domain/entities/payments';
import { StrategyContext } from '@infrastructure/strategies/strategy.context';
import { StrategyFactory } from '@infrastructure/strategies/strategy.factory';

@Injectable()
export class ProcessPaymentUseCase {
  private readonly IDEMPOTENCY_LOCK_TTL = 30000; // 30 seconds
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly kafkaProducer: KafkaProducer,
    private readonly redis: RedisClient,
    private readonly strategyContext: StrategyContext,
    private readonly strategyFactory: StrategyFactory,
    private readonly logger: LoggingService,
    private readonly tracer: TracingService,
    private readonly metrics: MetricsService,
  ) {}

  async execute(dto: PaymentCreateDto): Promise<any> {
    return this.tracer.startActiveSpan(
      'ProcessPaymentUseCase.execute',
      async (span) => {
        try {
          span.setAttributes({
            'user.id': dto.userId,
            'order.id': dto.orderId,
            'idempotency.key': dto.idempotencyKey,
          });

          const idempotencyKey = new IdempotencyKey(dto.idempotencyKey);
          const lockKey = `lock:payment:${idempotencyKey.getValue()}`;
          const cacheKey = `cache:payment:${idempotencyKey.getValue()}`;

          // Check cache first
          const cachedResult = await this.redis.get(cacheKey);
          if (cachedResult) {
            this.logger.log(
              `Cache hit for payment ${idempotencyKey.getValue()}`,
              { ctx: 'ProcessPaymentUseCase' },
            );
            return JSON.parse(cachedResult);
          }

          // Acquire distributed lock
          const lockAcquired = await this.redis.lock(
            lockKey,
            this.IDEMPOTENCY_LOCK_TTL,
          );
          if (!lockAcquired) {
            throw new IdempotencyException('Request already being processed');
          }

          try {
            // Check for existing payment (idempotency)
            const existingPayment =
              await this.paymentRepository.findByIdempotencyKey(
                idempotencyKey.getValue(),
              );
            if (existingPayment) {
              this.logger.log(
                `Idempotent payment found: ${existingPayment.getId()}`,
                { ctx: 'ProcessPaymentUseCase' },
              );
              const result = this.mapToResponse(existingPayment);
              await this.redis.set(
                cacheKey,
                JSON.stringify(result),
                this.CACHE_TTL,
              );
              return result;
            }

            // Create payment
            const amount = new Money(dto.amount.amount, dto.amount.currency);
            const payment = Payment.create(
              dto.userId,
              dto.orderId,
              amount,
              idempotencyKey,
              dto.paymentGateway,
            );

            await this.paymentRepository.save(payment);
            this.logger.log(`Payment created: ${payment.getId()}`, {
              ctx: 'ProcessPaymentUseCase',
            });

            // Set and execute strategy
            this.strategyContext.setStrategy(
              this.strategyFactory.getStrategy(
                dto.paymentGateway as PaymentGateway,
              ) as any,
            );

            // Process payment with retry logic
            const paymentResult = await retry(
              () =>
                this.strategyContext.executePayment(
                  dto.userId,
                  amount,
                  idempotencyKey.getValue(),
                ),
              { retries: 3, delay: 1000, backoff: 'EXPONENTIAL' },
            );

            if (paymentResult.status === 'SUCCESS') {
              payment.succeed(paymentResult.transactionId);
            } else {
              payment.fail();
            }

            await this.paymentRepository.update(payment);
            this.logger.log(
              `Payment updated: ${payment.getId()} with status ${payment.getStatus()}`,
              { ctx: 'ProcessPaymentUseCase' },
            );

            // Publish event to Kafka
            await this.kafkaProducer.sendPaymentEvent({
              paymentId: payment.getId(),
              userId: payment.getUserId(),
              orderId: payment.getOrderId(),
              amount: amount.toJSON(),
              status: payment.getStatus(),
              transactionId: payment.getTransactionId(),
            });

            this.metrics.incPaymentCounter({
              method: 'process_payment',
              status: payment.getStatus(),
              gateway: dto.paymentGateway,
            });

            const result = this.mapToResponse(payment);
            await this.redis.set(
              cacheKey,
              JSON.stringify(result),
              this.CACHE_TTL,
            );
            return result;
          } finally {
            await this.redis.unlock(lockKey);
          }
        } catch (error: any) {
          this.logger.error(`Failed to process payment: ${error.message}`, {
            error,
            ctx: 'ProcessPaymentUseCase',
          });
          this.metrics.incPaymentCounter({
            method: 'process_payment',
            status: 'FAILED',
            gateway: dto.paymentGateway,
          });
          throw error;
        }
      },
    );
  }

  private mapToResponse(payment: Payment): any {
    return {
      id: payment.getId(),
      userId: payment.getUserId(),
      orderId: payment.getOrderId(),
      amount: payment.getAmount().toJSON(),
      status: payment.getStatus(),
      transactionId: payment.getTransactionId() || '',
      error:
        payment.getStatus() === PaymentStatus.FAILED
          ? 'Payment processing failed'
          : '',
    };
  }
}
