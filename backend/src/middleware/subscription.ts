import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './auth';
import { prisma } from '../config/database';

/**
 * 프리미엄 구독이 필요한 기능에 사용
 */
export async function requirePremium(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as JwtPayload;

  if (user.userId === 'guest') {
    return reply.status(402).send({
      error: '회원 전용 기능입니다',
      message: '회원가입 후 이용해주세요',
      upgradeUrl: '/signup',
    });
  }

  // 사용자의 구독 정보 확인
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!dbUser) {
    return reply.status(404).send({ error: '사용자를 찾을 수 없습니다' });
  }

  // 구독 만료 체크
  if (dbUser.subscriptionExpiresAt && new Date() > dbUser.subscriptionExpiresAt) {
    // 만료된 경우 free로 강등
    await prisma.user.update({
      where: { id: user.userId },
      data: { subscriptionTier: 'free' },
    });

    return reply.status(402).send({
      error: '구독이 만료되었습니다',
      message: '프리미엄 플랜을 갱신해주세요',
      upgradeUrl: '/pricing',
    });
  }

  // 무료 사용자 체크
  if (dbUser.subscriptionTier === 'free') {
    return reply.status(402).send({
      error: '프리미엄 전용 기능입니다',
      message: '프리미엄 플랜으로 업그레이드하면 이용할 수 있습니다',
      currentPlan: 'free',
      upgradeUrl: '/pricing',
    });
  }

  // 프리미엄 사용자는 통과
}

/**
 * 무료 플랜 회고 횟수 제한 체크 (월 10회)
 */
export async function checkReflectionLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as JwtPayload;

  // 게스트는 제한 없음 (이미 authenticate에서 체크)
  if (user.userId === 'guest') {
    return;
  }

  // 사용자의 구독 정보 확인
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!dbUser) {
    return reply.status(404).send({ error: '사용자를 찾을 수 없습니다' });
  }

  // 프리미엄 사용자는 제한 없음
  if (dbUser.subscriptionTier === 'premium' || dbUser.subscriptionTier === 'family') {
    // 구독 만료 체크
    if (dbUser.subscriptionExpiresAt && new Date() > dbUser.subscriptionExpiresAt) {
      // 만료된 경우 free로 강등 후 제한 체크
      await prisma.user.update({
        where: { id: user.userId },
        data: { subscriptionTier: 'free' },
      });
    } else {
      return; // 유효한 프리미엄 사용자는 통과
    }
  }

  // 무료 사용자: 이번 달 회고 횟수 체크
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const reflectionCount = await prisma.reflection.count({
    where: {
      userId: user.userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const FREE_LIMIT = 10;

  if (reflectionCount >= FREE_LIMIT) {
    return reply.status(402).send({
      error: '월 사용 한도를 초과했습니다',
      message: `무료 플랜은 월 ${FREE_LIMIT}회까지 사용 가능합니다`,
      currentUsage: reflectionCount,
      limit: FREE_LIMIT,
      upgradeUrl: '/pricing',
      benefits: [
        '✅ 무제한 AI 회고',
        '✅ 고급 마음 날씨 지수',
        '✅ 데이터 내보내기',
        '✅ 광고 제거',
      ],
    });
  }

  // 남은 횟수 헤더에 추가
  reply.header('X-Reflection-Usage', reflectionCount);
  reply.header('X-Reflection-Limit', FREE_LIMIT);
  reply.header('X-Reflection-Remaining', FREE_LIMIT - reflectionCount);
}

/**
 * 현재 사용자의 사용량 정보 반환
 */
export async function getUsageInfo(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // 프리미엄 사용자는 무제한
  if (dbUser.subscriptionTier !== 'free') {
    return {
      subscriptionTier: dbUser.subscriptionTier,
      isUnlimited: true,
      currentUsage: null,
      limit: null,
      remaining: null,
    };
  }

  // 무료 사용자: 이번 달 사용량 계산
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const reflectionCount = await prisma.reflection.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const FREE_LIMIT = 10;

  return {
    subscriptionTier: 'free',
    isUnlimited: false,
    currentUsage: reflectionCount,
    limit: FREE_LIMIT,
    remaining: Math.max(0, FREE_LIMIT - reflectionCount),
  };
}
