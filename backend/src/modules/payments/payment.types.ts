// Toss Payments API 타입 정의

export interface TossPaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  failUrl: string;
}

export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  approvedAt: string;
  receipt?: {
    url: string;
  };
  card?: {
    number: string;
    company: string;
    cardType: string;
  };
}

export interface BillingKeyRequest {
  customerKey: string;
  authKey: string;
}

export interface BillingKeyResponse {
  customerKey: string;
  billingKey: string;
  authenticatedAt: string;
  card?: {
    number: string;
    company: string;
    cardType: string;
  };
}

export interface SubscriptionPlan {
  plan: 'premium' | 'family';
  amount: number;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  premium: {
    plan: 'premium',
    amount: 9900,
    description: '프리미엄 플랜 - 월 9,900원',
  },
  family: {
    plan: 'family',
    amount: 14900,
    description: '패밀리 플랜 - 월 14,900원',
  },
};

export interface CreatePaymentInput {
  userId: string;
  plan: 'premium' | 'family';
  successUrl: string;
  failUrl: string;
}

export interface ConfirmPaymentInput {
  userId: string;
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface WebhookEvent {
  eventType: string;
  createdAt: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
  };
}
