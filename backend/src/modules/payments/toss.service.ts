// Toss Payments API 클라이언트
import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import {
  TossPaymentConfirm,
  TossPaymentResponse,
  BillingKeyRequest,
  BillingKeyResponse,
} from './payment.types';

class TossPaymentsClient {
  private client: AxiosInstance;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor() {
    this.secretKey = config.tossSecretKey;

    // Base64 인코딩 (Toss Payments 인증 방식)
    const encodedKey = Buffer.from(`${this.secretKey}:`).toString('base64');

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * 결제 승인
   * https://docs.tosspayments.com/reference#%EA%B2%B0%EC%A0%9C-%EC%8A%B9%EC%9D%B8
   */
  async confirmPayment(data: TossPaymentConfirm): Promise<TossPaymentResponse> {
    try {
      const response = await this.client.post<TossPaymentResponse>('/payments/confirm', data);
      return response.data;
    } catch (error: any) {
      console.error('Toss Payment Confirmation Error:', error.response?.data);
      throw new Error(
        error.response?.data?.message || '결제 승인에 실패했습니다'
      );
    }
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<TossPaymentResponse> {
    try {
      const response = await this.client.get<TossPaymentResponse>(
        `/payments/${paymentKey}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Toss Payment Retrieval Error:', error.response?.data);
      throw new Error('결제 정보를 가져올 수 없습니다');
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number
  ): Promise<TossPaymentResponse> {
    try {
      const response = await this.client.post<TossPaymentResponse>(
        `/payments/${paymentKey}/cancel`,
        {
          cancelReason,
          ...(cancelAmount && { cancelAmount }),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Toss Payment Cancellation Error:', error.response?.data);
      throw new Error('결제 취소에 실패했습니다');
    }
  }

  /**
   * 빌링키 발급 (자동결제용)
   * https://docs.tosspayments.com/reference#%EB%B9%8C%EB%A7%81%ED%82%A4-%EB%B0%9C%EA%B8%89
   */
  async issueBillingKey(
    data: BillingKeyRequest
  ): Promise<BillingKeyResponse> {
    try {
      const response = await this.client.post<BillingKeyResponse>(
        '/billing/authorizations/card',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Toss Billing Key Error:', error.response?.data);
      throw new Error('자동결제 등록에 실패했습니다');
    }
  }

  /**
   * 빌링키로 결제 (자동결제)
   */
  async payWithBillingKey(
    billingKey: string,
    customerKey: string,
    amount: number,
    orderId: string,
    orderName: string
  ): Promise<TossPaymentResponse> {
    try {
      const response = await this.client.post<TossPaymentResponse>(
        `/billing/${billingKey}`,
        {
          customerKey,
          amount,
          orderId,
          orderName,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Toss Billing Payment Error:', error.response?.data);
      throw new Error('자동결제에 실패했습니다');
    }
  }

  /**
   * 빌링키 삭제
   */
  async deleteBillingKey(billingKey: string, customerKey: string): Promise<void> {
    try {
      await this.client.delete(`/billing/${billingKey}`, {
        data: { customerKey },
      });
    } catch (error: any) {
      console.error('Toss Billing Key Deletion Error:', error.response?.data);
      throw new Error('자동결제 해지에 실패했습니다');
    }
  }
}

export const tossPaymentsClient = new TossPaymentsClient();
