import { FastifyRequest, FastifyReply } from 'fastify';
import { reflectionService } from './reflection.service';
import { claudeClient } from './ai/claudeClient';
import {
  createReflectionSchema,
  sendMessageSchema,
  CreateReflectionInput,
  SendMessageInput,
} from './reflection.types';
import { getAuthUser } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { EmotionTag, CounselingStyle } from './ai/prompts';
import { buildPastContextPrompt } from './ai/contextRetriever';

export class ReflectionController {
  /**
   * POST /api/reflections
   * 새로운 회고 생성
   */
  async createReflection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const body = createReflectionSchema.parse(request.body);

      const result = await reflectionService.createReflection(user.userId, body);

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * GET /api/reflections
   * 회고 목록 조회
   */
  async getReflections(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const query = request.query as any;

      const result = await reflectionService.getReflections(user.userId, {
        page: query.page ? parseInt(query.page) : undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
        emotionTag: query.emotionTag,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * GET /api/reflections/:id
   * 회고 상세 조회
   */
  async getReflectionById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const { id } = request.params as { id: string };

      const result = await reflectionService.getReflectionById(user.userId, id);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({ error: error.message });
      }
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * DELETE /api/reflections/:id
   * 회고 삭제
   */
  async deleteReflection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const { id } = request.params as { id: string };

      await reflectionService.deleteReflection(user.userId, id);

      return reply.code(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({ error: error.message });
      }
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * POST /api/reflections/:id/end-session
   * 상담 마무리 - 추천 액션 생성
   */
  async endSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const { id } = request.params as { id: string };

      const result = await reflectionService.endSession(user.userId, id);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * POST /api/chat/send
   * 대화 메시지 전송 (비스트리밍)
   */
  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const body = sendMessageSchema.parse(request.body);

      const result = await reflectionService.sendMessage(user.userId, body);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
    }
  }

  /**
   * POST /api/chat/stream
   * 스트리밍 AI 응답
   */
  async streamMessage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = getAuthUser(request);
      const body = sendMessageSchema.parse(request.body);
      const isGuestMode = user.userId === 'guest' || body.reflectionId.startsWith('guest-');

      let messages: { role: 'user' | 'assistant'; content: string }[];
      let emotionTag: EmotionTag | undefined;
      let pastContext: string | undefined;

      if (isGuestMode) {
        // 게스트 모드: DB 없이 현재 메시지만 사용
        messages = [{ role: 'user', content: body.content }];
        emotionTag = undefined;
        pastContext = undefined;
      } else {
        // 회고 소유권 확인
        const reflection = await prisma.reflection.findFirst({
          where: {
            id: body.reflectionId,
            userId: user.userId,
          },
        });

        if (!reflection) {
          return reply.code(404).send({ error: '회고를 찾을 수 없습니다' });
        }

        // 기존 대화 히스토리 가져오기
        const conversationHistory = await prisma.conversation.findMany({
          where: { reflectionId: body.reflectionId },
          orderBy: { timestamp: 'asc' },
          take: 10,
        });

        // 사용자 메시지 저장
        await prisma.conversation.create({
          data: {
            reflectionId: body.reflectionId,
            role: 'user',
            content: body.content,
          },
        });

        messages = [
          ...conversationHistory.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content: body.content },
        ];

        emotionTag = reflection.emotionalTone as EmotionTag;
        pastContext = await buildPastContextPrompt(
          user.userId,
          body.content,
          reflection.emotionalTone || undefined,
          body.reflectionId,
        );
      }

      // SSE 헤더 설정
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      let fullResponse = '';

      // 스트리밍 응답
      const result = await claudeClient.streamReframingResponse(
        messages,
        emotionTag,
        (chunk) => {
          fullResponse += chunk;
          // SSE 형식으로 청크 전송
          reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        },
        pastContext,
        body.counselingStyle as CounselingStyle
      );

      // 완료 이벤트
      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      reply.raw.end();

      // AI 응답 저장 (비동기, 게스트가 아닌 경우만)
      if (!isGuestMode) {
        prisma.conversation
          .create({
            data: {
              reflectionId: body.reflectionId,
              role: 'assistant',
              content: fullResponse,
              aiModel: 'claude-sonnet-4-20250514',
              tokensUsed: result.tokensUsed,
            },
          })
          .catch((error) => {
            console.error('Failed to save AI response:', error);
          });
      }
    } catch (error) {
      if (!reply.sent) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: '서버 오류가 발생했습니다' });
      }
    }
  }
}

export const reflectionController = new ReflectionController();
