import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../modules/auth/auth.types';

/**
 * JWT 인증 미들웨어
 *
 * 사용법:
 * server.get('/protected', {
 *   preHandler: [authenticate],
 *   handler: async (request, reply) => {
 *     const user = request.user as JwtPayload;
 *     // ...
 *   }
 * });
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.code(401).send({
      error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.',
    });
  }
}

/**
 * 선택적 JWT 인증 미들웨어 (게스트 모드 지원)
 *
 * 인증이 있으면 사용자 정보 설정, 없으면 게스트로 통과
 */
export async function authenticateOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    // 인증 실패 시 게스트 사용자로 설정
    request.user = {
      userId: 'guest',
      email: 'guest@forestofcalm.local',
    } as JwtPayload;
  }
}

/**
 * 인증된 사용자 정보 가져오기
 */
export function getAuthUser(request: FastifyRequest): JwtPayload {
  return request.user as JwtPayload;
}

/**
 * 게스트 사용자인지 확인
 */
export function isGuest(request: FastifyRequest): boolean {
  const user = request.user as JwtPayload;
  return user?.userId === 'guest';
}
