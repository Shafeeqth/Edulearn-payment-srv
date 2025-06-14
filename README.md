payment-service/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── payment.ts
│   │   │   ├── refund.ts
│   │   │   ├── transaction.ts
│   │   ├── value-objects/
│   │   │   ├── money.ts
│   │   │   ├── idempotency-key.ts
│   │   ├── interfaces/
│   │   │   ├── payment-gateway.interface.ts
│   │   │   ├── payment-repository.interface.ts
│   │   │   ├── refund-repository.interface.ts
│   │   │   ├── kafka-producer.interface.ts
│   │   │   ├── redis.interface.ts
│   │   ├── strategies/
│   │   │   ├── payment-strategy.interface.ts
│   │   │   ├── stripe-payment.strategy.ts
│   │   │   ├── paypal-payment.strategy.ts
│   │   ├── exceptions/
│   │   │   ├── payment-failed.exception.ts
│   │   │   ├── refund-failed.exception.ts
│   │   │   ├── idempotency.exception.ts
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── payment-create.dto.ts
│   │   │   ├── refund-create.dto.ts
│   │   │   ├── payment-response.dto.ts
│   │   │   ├── refund-response.dto.ts
│   │   ├── use-cases/
│   │   │   ├── process-payment/
│   │   │   │   ├── process-payment.use-case.ts
│   │   │   ├── process-refund/
│   │   │   │   ├── process-refund.use-case.ts
│   │   │   ├── handle-payment-event/
│   │   │   │   ├── handle-payment-event.use-case.ts
│   │   │   ├── retry-failed-payment/
│   │   │   │   ├── retry-failed-payment.use-case.ts
│   │   ├── services/
│   │   │   ├── idempotency.service.ts
│   │   │   ├── webhook.service.ts
│   │   │   ├── retry.service.ts
│   │   ├── exceptions/
│   │   │   ├── validation.exception.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   │   ├── payment.entity.ts
│   │   │   │   ├── refund.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── payment.repository.ts
│   │   │   │   ├── refund.repository.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 1698765432100-create-payment-table.ts
│   │   │   │   ├── 1698765432101-create-refund-table.ts
│   │   ├── kafka/
│   │   │   ├── kafka-producer.service.ts
│   │   │   ├── kafka-consumer.service.ts
│   │   ├── redis/
│   │   │   ├── redis.service.ts
│   │   ├── grpc/
│   │   │   ├── interceptors/
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   ├── metrics.interceptor.ts
│   │   │   │   ├── tracing.interceptor.ts
│   │   │   │   ├── auth.interceptor.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.controller.ts
│   │   ├── strategies/
│   │   │   ├── stripe-payment.strategy.ts
│   │   │   ├── paypal-payment.strategy.ts
│   │   ├── webhooks/
│   │   │   ├── webhook.controller.ts
│   │   │   ├── webhook.service.ts
│   │   ├── auth/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── role.guard.ts
│   │   ├── observability/
│   │   │   ├── logging/
│   │   │   │   ├── loki.logger.ts
│   │   │   ├── tracing/
│   │   │   │   ├── tracing.setup.ts
│   │   │   ├── metrics/
│   │   │   │   ├── metrics.setup.ts
│   │   ├── config/
│   │   │   ├── config.module.ts
│   │   │   ├── config.service.ts
│   ├── interface/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   ├── protos/
│   │   ├── payment-service.proto
│   ├── schemas/
│   │   ├── payment.avsc
│   │   ├── refund.avsc
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   ├── integration/
│   │   ├── e2e/
│   │   ├── test-setup.ts
├── Dockerfile
├── docker-compose.yml
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── network-policy.yaml
├── .env
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
├── README.md