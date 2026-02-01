import { FastifyInstance } from 'fastify';
import { authenticateOptional } from '../../middleware/auth';
import { requirePremium } from '../../middleware/subscription';
import {
  getTodayEmotionStats,
  calculateMindWeather,
  getLatestMindWeather,
  getMindWeatherTrend,
} from './analytics.controller';

export async function analyticsRoutes(server: FastifyInstance) {
  // GET /api/analytics/today-emotions - 오늘의 감정 통계 (공개)
  server.get('/today-emotions', getTodayEmotionStats);

  // 인증 미들웨어 적용 (이하 라우트)
  server.addHook('preHandler', authenticateOptional);

  // POST /api/analytics/calculate - 마음 날씨 지수 계산 (프리미엄 전용)
  server.post('/calculate', {
    preHandler: requirePremium,
    handler: calculateMindWeather,
  });

  // GET /api/analytics/mind-weather - 최신 마음 날씨 조회 (프리미엄 전용)
  server.get('/mind-weather', {
    preHandler: requirePremium,
    handler: getLatestMindWeather,
  });

  // GET /api/analytics/trends - 트렌드 조회 (프리미엄 전용)
  server.get('/trends', {
    preHandler: requirePremium,
    handler: getMindWeatherTrend,
  });
}
