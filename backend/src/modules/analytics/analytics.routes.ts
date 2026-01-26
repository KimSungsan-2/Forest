import { FastifyInstance } from 'fastify';
import { authenticateOptional } from '../../middleware/auth';
import {
  calculateMindWeather,
  getLatestMindWeather,
  getMindWeatherTrend,
} from './analytics.controller';

export async function analyticsRoutes(server: FastifyInstance) {
  // 인증 미들웨어 적용
  server.addHook('preHandler', authenticateOptional);

  // POST /api/analytics/calculate - 마음 날씨 지수 계산
  server.post('/calculate', calculateMindWeather);

  // GET /api/analytics/mind-weather - 최신 마음 날씨 조회
  server.get('/mind-weather', getLatestMindWeather);

  // GET /api/analytics/trends - 트렌드 조회
  server.get('/trends', getMindWeatherTrend);
}
