class AmountDto {
  amount!: number;
  currency!: string;
}

export class PaymentResponseDto {
  id!: string;
  userId!: string;
  orderId!: string;
  amount!: AmountDto;
  status!: string;
  transactionId?: string;
  error?: string;
}
