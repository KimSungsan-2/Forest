import { FastifyInstance } from 'fastify';
import { reflectionController } from './reflection.controller';
import { authenticate, authenticateOptional } from '../../middleware/auth';

export async function reflectionRoutes(server: FastifyInstance) {
  // 게스트 모드 지원: 인증 선택사항
  server.addHook('preHandler', authenticateOptional);

  // 회고 생성
  server.post('/', {
    handler: reflectionController.createReflection.bind(reflectionController),
  });

  // 회고 목록 조회
  server.get('/', {
    handler: reflectionController.getReflections.bind(reflectionController),
  });

  // 회고 상세 조회
  server.get('/:id', {
    handler: reflectionController.getReflectionById.bind(reflectionController),
  });

  // 회고 삭제
  server.delete('/:id', {
    handler: reflectionController.deleteReflection.bind(reflectionController),
  });
}

export async function chatRoutes(server: FastifyInstance) {
  // 게스트 모드 지원: 인증 선택사항
  server.addHook('preHandler', authenticateOptional);

  // 메시지 전송 (비스트리밍)
  server.post('/send', {
    handler: reflectionController.sendMessage.bind(reflectionController),
  });

  // 메시지 전송 (스트리밍)
  server.post('/stream', {
    handler: reflectionController.streamMessage.bind(reflectionController),
  });
}
