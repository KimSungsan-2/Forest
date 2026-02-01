import { FastifyRequest, FastifyReply } from 'fastify';
import { pushService } from './push.service';

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * GET /api/push/vapid-key
 * VAPID 공개키 반환 (인증 불필요)
 */
export async function getVapidKey(request: FastifyRequest, reply: FastifyReply) {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    return reply.code(404).send({ error: 'Push notifications not configured' });
  }
  return reply.send({ publicKey: key });
}

/**
 * POST /api/push/subscribe
 * 푸시 구독 등록
 */
export async function subscribe(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as JwtPayload;

    if (payload.userId === 'guest') {
      return reply.code(400).send({ error: '로그인이 필요합니다' });
    }

    const body = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return reply.code(400).send({ error: 'Invalid subscription data' });
    }

    await pushService.subscribe(payload.userId, body);
    return reply.code(201).send({ message: '알림이 등록되었습니다' });
  } catch (error) {
    return reply.code(500).send({ error: '알림 등록에 실패했습니다' });
  }
}

/**
 * DELETE /api/push/subscribe
 * 푸시 구독 해제
 */
export async function unsubscribe(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const payload = request.user as JwtPayload;

    const body = request.body as { endpoint: string };
    if (!body.endpoint) {
      return reply.code(400).send({ error: 'endpoint is required' });
    }

    await pushService.unsubscribe(payload.userId, body.endpoint);
    return reply.send({ message: '알림이 해제되었습니다' });
  } catch (error) {
    return reply.code(500).send({ error: '알림 해제에 실패했습니다' });
  }
}

/**
 * POST /api/push/send-evening
 * 저녁 알림 수동 트리거 (관리자용)
 */
export async function sendEvening(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await pushService.sendEveningReminders();
    return reply.send(result);
  } catch (error) {
    return reply.code(500).send({ error: '알림 전송에 실패했습니다' });
  }
}
