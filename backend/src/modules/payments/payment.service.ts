// 결제 비즈니스 로직
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { tossPaymentsClient } from './toss.service';
import {
  CreatePaymentInput,
  ConfirmPaymentInput,
  SUBSCRIPTION_PLANS,
} from './payment.types';

class PaymentService {
  /**
   * 결제 초기화
   * 사용자가 "업그레이드" 버튼을 클릭했을 때
   */
  async initializePayment(input: CreatePaymentInput) {
    const { userId, plan, successUrl, failUrl } = input;

    // 플랜 검증
    const planInfo = SUBSCRIPTION_PLANS[plan];
    if (!planInfo) {
      throw new Error('유효하지 않은 플랜입니다');
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 고유한 주문 ID 생성 (Toss Payments 규칙: 영문, 숫자, -, _ 만 허용, 6-64자)
    // UUID 형태로 생성하되 하이픈 제거하여 32자로 유지
    const orderId = `ORDER-${Date.now()}-${uuidv4().replace(/-/g, '').substring(0, 8)}`;

    // Payment 레코드 생성 (pending 상태)
    await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount: planInfo.amount,
        plan,
        description: planInfo.description,
        status: 'pending',
      },
    });

    // Toss Payments 결제 위젯에 전달할 정보 반환
    return {
      orderId,
      amount: planInfo.amount,
      orderName: planInfo.description,
      customerEmail: user.email,
      customerName: user.displayName || undefined,
      successUrl,
      failUrl,
    };
  }

  /**
   * 결제 승인 및 구독 활성화
   * Toss Payments 위젯에서 결제 완료 후 successUrl로 리다이렉트되면 호출
   */
  async confirmPayment(input: ConfirmPaymentInput) {
    const { userId, paymentKey, orderId, amount } = input;

    // 1. Payment 레코드 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다');
    }

    if (payment.userId !== userId) {
      throw new Error('권한이 없습니다');
    }

    if (payment.status !== 'pending') {
      throw new Error('이미 처리된 결제입니다');
    }

    if (payment.amount !== amount) {
      throw new Error('결제 금액이 일치하지 않습니다');
    }

    // 2. Toss Payments API로 결제 승인 요청
    let tossResponse;
    try {
      tossResponse = await tossPaymentsClient.confirmPayment({
        paymentKey,
        orderId,
        amount,
      });
    } catch (error: any) {
      // 결제 실패 시 Payment 상태 업데이트
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: 'failed',
          failReason: error.message,
        },
      });
      throw error;
    }

    // 3. 결제 성공 - Payment 업데이트
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'completed',
        paymentKey,
        method: tossResponse.method,
        paidAt: new Date(tossResponse.approvedAt),
      },
    });

    // 4. 구독 생성 또는 업데이트
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: payment.plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        paymentMethod: tossResponse.method,
      },
      update: {
        plan: payment.plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        paymentMethod: tossResponse.method,
        canceledAt: null,
        cancelReason: null,
      },
    });

    // 5. User의 레거시 필드 업데이트 (호환성)
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: payment.plan,
        subscriptionExpiresAt: oneMonthLater,
      },
    });

    return {
      subscription,
      payment,
      tossResponse,
    };
  }

  /**
   * 결제 실패 처리
   */
  async failPayment(orderId: string, failReason: string) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다');
    }

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'failed',
        failReason,
      },
    });

    return payment;
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(userId: string, reason: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('구독 정보를 찾을 수 없습니다');
    }

    if (subscription.status === 'canceled') {
      throw new Error('이미 취소된 구독입니다');
    }

    // 구독 취소 (기간 만료까지는 사용 가능)
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        cancelReason: reason,
      },
    });

    // 빌링키가 있다면 삭제
    if (subscription.billingKey && subscription.customerKey) {
      try {
        await tossPaymentsClient.deleteBillingKey(
          subscription.billingKey,
          subscription.customerKey
        );
      } catch (error) {
        console.error('Billing key deletion failed:', error);
        // 빌링키 삭제 실패는 무시 (이미 구독은 취소됨)
      }
    }

    return subscription;
  }

  /**
   * 사용자의 구독 및 결제 내역 조회
   */
  async getSubscriptionInfo(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      subscription,
      payments,
    };
  }

  /**
   * 결제 내역 조회
   */
  async getPaymentHistory(userId: string, limit = 20) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 특정 결제 조회
   */
  async getPaymentByOrderId(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
    });
  }
}

export const paymentService = new PaymentService();
