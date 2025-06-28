export abstract class KafkaProducer {
  abstract sendPaymentEvent(event: any): Promise<void>;
  abstract sendRefundEvent(event: any): Promise<void>;
}
