import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from './analytics.service';
import { JwtPayload } from '../../middleware/auth';

/**
 * 오늘의 감정 통계 (공개 — 인증 불필요)
 */
export async function getTodayEmotionStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await analyticsService.getTodayEmotionStats();
    return reply.status(200).send(stats);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: '감정 통계 조회에 실패했습니다',
    });
  }
}

/**
 * 마음 날씨 지수 계산 (온디맨드)
 */
export async function calculateMindWeather(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user as JwtPayload;

    if (user.userId === 'guest') {
      return reply.status(403).send({
        error: '게스트 사용자는 마음 날씨 지수를 계산할 수 없습니다. 회원가입 후 이용해주세요.',
      });
    }

    const weatherScore = await analyticsService.calculateAndSaveMindWeather(
      user.userId
    );

    return reply.status(200).send(weatherScore);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: '마음 날씨 지수 계산에 실패했습니다',
      details: error.message,
    });
  }
}

/**
 * 최신 마음 날씨 지수 조회
 */
export async function getLatestMindWeather(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user as JwtPayload;

    if (user.userId === 'guest') {
      return reply.status(403).send({
        error: '게스트 사용자는 저장된 마음 날씨 지수가 없습니다. 회원가입 후 이용해주세요.',
      });
    }

    const weatherScore = await analyticsService.getLatestMindWeather(
      user.userId
    );

    if (!weatherScore) {
      return reply.status(404).send({
        error: '마음 날씨 지수를 찾을 수 없습니다. 먼저 계산을 실행해주세요.',
      });
    }

    return reply.status(200).send(weatherScore);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: '마음 날씨 지수 조회에 실패했습니다',
      details: error.message,
    });
  }
}

/**
 * 마음 날씨 트렌드 조회
 */
export async function getMindWeatherTrend(
  request: FastifyRequest<{
    Querystring: { days?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const user = request.user as JwtPayload;

    if (user.userId === 'guest') {
      return reply.status(403).send({
        error: '게스트 사용자는 트렌드를 조회할 수 없습니다.',
      });
    }

    const days = parseInt(request.query.days || '30', 10);
    const limit = Math.min(days, 90); // 최대 90일

    const trend = await analyticsService.getMindWeatherTrend(
      user.userId,
      limit
    );

    return reply.status(200).send({
      trend,
      period: { days: limit },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: '트렌드 조회에 실패했습니다',
      details: error.message,
    });
  }
}
