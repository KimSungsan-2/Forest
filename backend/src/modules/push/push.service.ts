import webpush from 'web-push';
import { prisma } from '../../config/database';
import { config } from '../../config/env';

// VAPID 설정
if (config.vapidPublicKey && config.vapidPrivateKey) {
  webpush.setVapidDetails(
    config.vapidEmail || 'mailto:admin@forestofcalm.com',
    config.vapidPublicKey,
    config.vapidPrivateKey
  );
  console.log('[Push] VAPID keys configured');
} else {
  console.warn('[Push] VAPID keys not set — push notifications disabled');
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const EVENING_MESSAGES = [
  {
    title: '오늘 하루 어떠셨나요?',
    body: '아이와 함께한 하루, 기록으로 남겨보세요 🌲',
  },
  {
    title: '오늘도 수고했어요',
    body: '잠들기 전 3분, 마음을 털어놓아 보세요 🌿',
  },
  {
    title: '오늘 하루를 돌아보며',
    body: '좋았든 힘들었든, 당신의 하루가 소중해요 🍃',
  },
  {
    title: '하루를 마무리하며',
    body: '부모로서의 오늘, 한 줄이라도 남겨보세요 ✨',
  },
  {
    title: '잠들기 전 잠깐',
    body: '오늘 아이와의 시간, 어떤 감정이 남아있나요? 🌙',
  },
];

export class PushService {
  /**
   * 푸시 구독 저장
   */
  async subscribe(userId: string, subscription: PushSubscriptionData) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  /**
   * 푸시 구독 해제
   */
  async unsubscribe(userId: string, endpoint: string) {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * 특정 사용자에게 푸시 전송
   */
  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/vent',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          })
        )
      )
    );

    // 만료된 구독 정리
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const statusCode = (result.reason as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscriptions[i].id },
          }).catch(() => {});
        }
      }
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return { sent, total: subscriptions.length };
  }

  /**
   * 저녁 알림 전송 (모든 구독자에게)
   * cron 또는 수동 호출
   */
  async sendEveningReminders() {
    if (!config.vapidPublicKey) {
      console.log('[Push] VAPID not configured, skipping evening reminders');
      return { sent: 0, total: 0 };
    }

    // 오늘 이미 기록한 사용자 제외
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const usersWithTodayReflection = await prisma.reflection.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const excludeUserIds = new Set(usersWithTodayReflection.map((r) => r.userId));

    // 모든 구독 가져오기
    const allSubscriptions = await prisma.pushSubscription.findMany();

    // 오늘 안 기록한 사용자만 필터
    const targetSubs = allSubscriptions.filter((sub) => !excludeUserIds.has(sub.userId));

    if (targetSubs.length === 0) {
      console.log('[Push] No targets for evening reminder (all users already recorded today)');
      return { sent: 0, total: 0 };
    }

    // 랜덤 메시지 선택
    const message = EVENING_MESSAGES[Math.floor(Math.random() * EVENING_MESSAGES.length)];

    const results = await Promise.allSettled(
      targetSubs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: message.title,
            body: message.body,
            url: '/vent',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
          })
        )
      )
    );

    // 만료된 구독 정리
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const statusCode = ((results[i] as PromiseRejectedResult).reason as any)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: targetSubs[i].id },
          }).catch(() => {});
        }
      }
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`[Push] Evening reminders sent: ${sent}/${targetSubs.length}`);
    return { sent, total: targetSubs.length };
  }

  /**
   * VAPID 공개키 반환 (클라이언트가 구독 시 필요)
   */
  getVapidPublicKey(): string {
    return config.vapidPublicKey;
  }
}

export const pushService = new PushService();
