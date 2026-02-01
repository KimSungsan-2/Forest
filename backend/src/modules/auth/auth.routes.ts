import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';

export async function authRoutes(server: FastifyInstance) {
  // 회원가입
  server.post('/signup', {
    handler: authController.signup.bind(authController),
  });

  // 로그인
  server.post('/login', {
    handler: authController.login.bind(authController),
  });

  // 현재 사용자 정보 조회
  server.get('/me', {
    handler: authController.getMe.bind(authController),
  });

  // 프로필 업데이트
  server.put('/profile', {
    handler: authController.updateProfile.bind(authController),
  });

  // 사용량 정보 조회
  server.get('/usage', {
    handler: authController.getUsage.bind(authController),
  });

  // 프로모 코드 입력
  server.post('/redeem-promo', {
    handler: authController.redeemPromo.bind(authController),
  });
}
