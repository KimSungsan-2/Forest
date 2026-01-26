// 결제 API 클라이언트
import { apiRequest } from './client';

export interface PaymentInitResponse {
  orderId: string;
  amount: number;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  failUrl: string;
}

export interface SubscriptionInfo {
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    canceledAt: string | null;
    cancelReason: string | null;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    plan: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
}

export const paymentsApi = {
  /**
   * 결제 초기화
   */
  initializePayment: async (plan: 'premium' | 'family'): Promise<PaymentInitResponse> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return apiRequest('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        successUrl: `${origin}/payment/success`,
        failUrl: `${origin}/payment/fail`,
      }),
    });
  },

  /**
   * 결제 승인
   */
  confirmPayment: async (data: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<{ message: string; subscription: any; payment: any }> => {
    return apiRequest('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 결제 실패 처리
   */
  failPayment: async (data: {
    orderId: string;
    code?: string;
    message: string;
  }): Promise<{ message: string }> => {
    return apiRequest('/api/payments/fail', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 구독 정보 조회
   */
  getSubscription: async (): Promise<SubscriptionInfo> => {
    return apiRequest('/api/payments/subscription');
  },

  /**
   * 구독 취소
   */
  cancelSubscription: async (reason: string): Promise<{ message: string; subscription: any }> => {
    return apiRequest('/api/payments/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * 결제 내역 조회
   */
  getPaymentHistory: async (): Promise<
    Array<{
      id: string;
      amount: number;
      plan: string;
      status: string;
      paidAt: string | null;
      createdAt: string;
    }>
  > => {
    return apiRequest('/api/payments/history');
  },
};
