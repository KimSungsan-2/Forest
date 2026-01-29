import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { signupSchema, loginSchema, SignupInput, LoginInput, JwtPayload } from './auth.types';
import { config } from '../../config/env';
import { getUsageInfo } from '../../middleware/subscription';
import { prisma } from '../../config/database';

export class AuthController {
  /**
   * POST /api/auth/signup
   */
  async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = signupSchema.parse(request.body);
      const result = await authService.signup(body);

      // JWT 토큰 생성
      const token = request.server.jwt.sign(
        {
          userId: result.user.id,
          email: result.user.email,
        } as JwtPayload,
        {
          expiresIn: config.jwtExpiresIn,
        }
      );

      return reply.code(201).send({
        ...result,
        token,
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '서버 오류가 발생했습니다',
      });
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      const result = await authService.login(body);

      // JWT 토큰 생성
      const token = request.server.jwt.sign(
        {
          userId: result.user.id,
          email: result.user.email,
        } as JwtPayload,
        {
          expiresIn: config.jwtExpiresIn,
        }
      );

      return reply.code(200).send({
        ...result,
        token,
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(401).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '서버 오류가 발생했습니다',
      });
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      const user = await authService.getUserById(payload.userId);

      return reply.code(200).send({ user });
    } catch (error) {
      return reply.code(401).send({
        error: '인증이 필요합니다',
      });
    }
  }

  /**
   * GET /api/auth/usage
   * 현재 사용자의 사용량 정보 조회
   */
  async getUsage(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(200).send({
          subscriptionTier: 'guest',
          isUnlimited: true,
          message: '게스트 사용자는 무제한입니다',
        });
      }

      const usageInfo = await getUsageInfo(payload.userId);

      return reply.code(200).send(usageInfo);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: '사용량 조회에 실패했습니다',
      });
    }
  }
  /**
   * POST /api/auth/redeem-promo
   * 프로모 코드 입력으로 프리미엄 업그레이드
   */
  async redeemPromo(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const payload = request.user as JwtPayload;

      if (payload.userId === 'guest') {
        return reply.code(400).send({ error: '로그인이 필요합니다' });
      }

      const { code } = request.body as { code?: string };
      if (!code || typeof code !== 'string') {
        return reply.code(400).send({ error: '프로모 코드를 입력해주세요' });
      }

      const validCodes = config.promoCodes;
      if (validCodes.length === 0 || !validCodes.includes(code.trim())) {
        return reply.code(400).send({ error: '유효하지 않은 프로모 코드입니다' });
      }

      // 프리미엄으로 업그레이드 (1년)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await prisma.user.update({
        where: { id: payload.userId },
        data: {
          subscriptionTier: 'premium',
          subscriptionExpiresAt: expiresAt,
        },
      });

      return reply.code(200).send({
        message: '프리미엄으로 업그레이드되었습니다!',
        subscriptionTier: 'premium',
        expiresAt,
      });
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: '프로모 코드 처리에 실패했습니다' });
    }
  }
}

export const authController = new AuthController();
