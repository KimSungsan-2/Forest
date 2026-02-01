import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSummary() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, totalReflections, totalConversations, newUsersToday, reflectionsToday] =
    await Promise.all([
      prisma.user.count(),
      prisma.reflection.count(),
      prisma.conversation.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.reflection.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

  return {
    totalUsers,
    totalReflections,
    totalConversations,
    newUsersToday,
    reflectionsToday,
  };
}

export async function getSubscriptionBreakdown() {
  const results = await prisma.user.groupBy({
    by: ['subscriptionTier'],
    _count: { id: true },
  });

  return results.map((r) => ({
    tier: r.subscriptionTier,
    count: r._count.id,
  }));
}

export async function getActiveUsers(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await prisma.reflection.findMany({
    where: { createdAt: { gte: since } },
    select: { userId: true },
    distinct: ['userId'],
  });

  return { days, activeUsers: result.length };
}

export async function getUserList(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { reflections: true },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      subscriptionTier: u.subscriptionTier,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      reflectionCount: u._count.reflections,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTokenUsage(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await prisma.conversation.aggregate({
    where: {
      timestamp: { gte: since },
      role: 'assistant',
      tokensUsed: { not: null },
    },
    _sum: { tokensUsed: true },
    _count: { id: true },
  });

  return {
    days,
    totalTokens: result._sum.tokensUsed || 0,
    totalResponses: result._count.id,
  };
}
