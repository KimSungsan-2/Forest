import { FastifyInstance } from 'fastify';
import { getVapidKey, subscribe, unsubscribe, sendEvening } from './push.controller';
import { requireAdmin } from '../../middleware/admin';

export async function pushRoutes(server: FastifyInstance) {
  // 공개 — VAPID 키 조회
  server.get('/vapid-key', getVapidKey);

  // 인증 필요 — 구독/해제
  server.post('/subscribe', subscribe);
  server.delete('/subscribe', unsubscribe);

  // 관리자 전용 — 수동 저녁 알림 트리거
  server.post('/send-evening', {
    preHandler: [requireAdmin],
    handler: sendEvening,
  });
}
