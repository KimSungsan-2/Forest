// 결제 라우트
import { FastifyInstance } from 'fastify';
import { paymentController } from './payment.controller';

export async function paymentRoutes(server: FastifyInstance) {
  // 결제 초기화 (업그레이드 버튼 클릭 시)
  server.post('/initialize', {
    handler: paymentController.initializePayment.bind(paymentController),
  });

  // 결제 승인 (Toss 위젯에서 결제 완료 후)
  server.post('/confirm', {
    handler: paymentController.confirmPayment.bind(paymentController),
  });

  // 결제 실패 처리
  server.post('/fail', {
    handler: paymentController.failPayment.bind(paymentController),
  });

  // 현재 사용자의 구독 정보 조회
  server.get('/subscription', {
    handler: paymentController.getSubscription.bind(paymentController),
  });

  // 구독 취소
  server.post('/subscription/cancel', {
    handler: paymentController.cancelSubscription.bind(paymentController),
  });

  // 결제 내역 조회
  server.get('/history', {
    handler: paymentController.getPaymentHistory.bind(paymentController),
  });

  // Toss Payments 웹훅
  server.post('/webhook', {
    handler: paymentController.handleWebhook.bind(paymentController),
  });
}
