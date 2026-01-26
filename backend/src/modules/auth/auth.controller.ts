import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { signupSchema, loginSchema, SignupInput, LoginInput, JwtPayload } from './auth.types';
import { config } from '../../config/env';

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
}

export const authController = new AuthController();
