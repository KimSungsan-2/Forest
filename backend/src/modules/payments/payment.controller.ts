// 결제 컨트롤러
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { paymentService } from './payment.service';
import { JwtPayload } from '../auth/auth.types';

// 결제 초기화 스키마
const initPaymentSchema = z.object({
  plan: z.enum(['premium', 'family']),
  successUrl: z.string().url().optional(),
  failUrl: z.string().url().optional(),
});

// 결제 승인 스키마
const confirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number().int().positive(),
});

// 결제 실패 스키마
const failPaymentSchema = z.object({
  orderId: z.string(),
  code: z.string().optional(),
  message: z.string(),
});

// 구독 취소 스키마
const cancelSubscriptionSchema = z.object({
  reason: z.string().min(1, '취소 사유를 입력해주세요'),
});

export class PaymentController {
  /**
   * POST /api/payments/initialize
   * 결제 초기화 (업그레이드 버튼 클릭 시)
   */
  async initializePayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(401).send({
          error: '회원만 구독할 수 있습니다',
          redirectUrl: '/signup',
        });
      }

      const body = initPaymentSchema.parse(request.body);

      // 기본 URL 설정
      const origin = request.headers.origin || 'http://localhost:3000';
      const successUrl = body.successUrl || `${origin}/payment/success`;
      const failUrl = body.failUrl || `${origin}/payment/fail`;

      const paymentInfo = await paymentService.initializePayment({
        userId: payload.userId,
        plan: body.plan,
        successUrl,
        failUrl,
      });

      return reply.code(200).send(paymentInfo);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '결제 초기화에 실패했습니다',
      });
    }
  }

  /**
   * POST /api/payments/confirm
   * 결제 승인 및 구독 활성화
   */
  async confirmPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(401).send({
          error: '권한이 없습니다',
        });
      }

      const body = confirmPaymentSchema.parse(request.body);

      const result = await paymentService.confirmPayment({
        userId: payload.userId,
        paymentKey: body.paymentKey,
        orderId: body.orderId,
        amount: body.amount,
      });

      return reply.code(200).send({
        message: '결제가 완료되었습니다',
        subscription: result.subscription,
        payment: result.payment,
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '결제 승인에 실패했습니다',
      });
    }
  }

  /**
   * POST /api/payments/fail
   * 결제 실패 처리
   */
  async failPayment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = failPaymentSchema.parse(request.body);

      await paymentService.failPayment(
        body.orderId,
        body.message || '결제가 실패했습니다'
      );

      return reply.code(200).send({
        message: '결제 실패 처리가 완료되었습니다',
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '결제 실패 처리에 실패했습니다',
      });
    }
  }

  /**
   * GET /api/payments/subscription
   * 현재 사용자의 구독 정보 조회
   */
  async getSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(200).send({
          subscription: null,
          payments: [],
        });
      }

      const info = await paymentService.getSubscriptionInfo(payload.userId);

      return reply.code(200).send(info);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '구독 정보 조회에 실패했습니다',
      });
    }
  }

  /**
   * POST /api/payments/subscription/cancel
   * 구독 취소
   */
  async cancelSubscription(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(401).send({
          error: '권한이 없습니다',
        });
      }

      const body = cancelSubscriptionSchema.parse(request.body);

      const subscription = await paymentService.cancelSubscription(
        payload.userId,
        body.reason
      );

      return reply.code(200).send({
        message: '구독이 취소되었습니다. 현재 결제 기간이 종료될 때까지 프리미엄 기능을 사용할 수 있습니다.',
        subscription,
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '구독 취소에 실패했습니다',
      });
    }
  }

  /**
   * GET /api/payments/history
   * 결제 내역 조회
   */
  async getPaymentHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(200).send([]);
      }

      const payments = await paymentService.getPaymentHistory(payload.userId);

      return reply.code(200).send(payments);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '결제 내역 조회에 실패했습니다',
      });
    }
  }

  /**
   * POST /api/payments/webhook
   * Toss Payments 웹훅 처리
   * TODO: 웹훅 서명 검증 추가 필요
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;

      console.log('Toss Payments Webhook:', body);

      // 웹훅 이벤트 타입에 따라 처리
      switch (body.eventType) {
        case 'PAYMENT_STATUS_CHANGED':
          // 결제 상태 변경 처리
          break;
        case 'BILLING_STATUS_CHANGED':
          // 구독 상태 변경 처리
          break;
        default:
          console.log('Unknown webhook event:', body.eventType);
      }

      return reply.code(200).send({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return reply.code(500).send({
        error: '웹훅 처리에 실패했습니다',
      });
    }
  }
}

export const paymentController = new PaymentController();
