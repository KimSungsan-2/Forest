// Toss Payments SDK Hook
import { useEffect, useState } from 'react';
import { paymentsApi, PaymentInitResponse } from '../api/payments';

// Toss Payments SDK 타입 정의
declare global {
  interface Window {
    TossPayments: any;
  }
}

// 테스트용 클라이언트 키 (실제로는 환경변수로 관리해야 함)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export function useTossPayments() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tossPayments, setTossPayments] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toss Payments SDK 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 로드된 경우
    if (window.TossPayments) {
      const instance = window.TossPayments(TOSS_CLIENT_KEY);
      setTossPayments(instance);
      setIsLoaded(true);
      return;
    }

    // SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;

    script.onload = () => {
      const instance = window.TossPayments(TOSS_CLIENT_KEY);
      setTossPayments(instance);
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Toss Payments SDK 로드에 실패했습니다');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: 스크립트 제거는 하지 않음 (재사용 가능)
    };
  }, []);

  /**
   * 결제 시작
   */
  const requestPayment = async (plan: 'premium' | 'family') => {
    if (!isLoaded || !tossPayments) {
      setError('결제 시스템이 준비되지 않았습니다');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. 백엔드에서 결제 정보 생성
      const paymentData = await paymentsApi.initializePayment(plan);

      // 2. Toss Payments 위젯 열기
      await tossPayments.requestPayment('카드', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      });

      // 성공 시 successUrl로 리다이렉트됨
    } catch (err: any) {
      console.error('Payment request error:', err);
      setError(err.message || '결제 요청에 실패했습니다');
      setIsProcessing(false);
    }
  };

  /**
   * 결제 승인 (successUrl에서 호출)
   */
  const confirmPayment = async (
    paymentKey: string,
    orderId: string,
    amount: number
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await paymentsApi.confirmPayment({
        paymentKey,
        orderId,
        amount,
      });

      setIsProcessing(false);
      return result;
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setError(err.message || '결제 승인에 실패했습니다');
      setIsProcessing(false);
      throw err;
    }
  };

  return {
    isLoaded,
    isProcessing,
    error,
    requestPayment,
    confirmPayment,
  };
}
