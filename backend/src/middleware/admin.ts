import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/env';
import { JwtPayload } from './auth';

const adminEmails: string[] = config.adminEmails;

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.code(401).send({
      error: '인증이 필요합니다.',
    });
  }

  const user = request.user as JwtPayload;

  if (!adminEmails.includes(user.email)) {
    return reply.code(403).send({
      error: '관리자 권한이 필요합니다.',
    });
  }
}
