import { prisma } from '../../config/database';
import { claudeClient } from './ai/claudeClient';
import {
  CreateReflectionInput,
  SendMessageInput,
  ReflectionResponse,
  ConversationResponse,
  ReflectionListQuery,
} from './reflection.types';
import { EmotionTag } from './ai/prompts';

export class ReflectionService {
  /**
   * 새로운 회고 생성 및 첫 AI 응답 생성
   */
  async createReflection(
    userId: string,
    data: CreateReflectionInput
  ): Promise<{
    reflection: ReflectionResponse;
    aiResponse: ConversationResponse;
  }> {
    // 게스트 모드: 데이터베이스에 저장하지 않고 AI 응답만 반환
    if (userId === 'guest') {
      const tempId = `guest-${Date.now()}`;

      // AI 응답 생성
      const aiResponseData = await claudeClient.getReframingResponse(
        [{ role: 'user', content: data.content }],
        data.emotionTag as EmotionTag
      );

      return {
        reflection: {
          id: tempId,
          userId: 'guest',
          title: data.title || this.generateTitle(data.content),
          content: data.content,
          createdAt: new Date(),
          updatedAt: new Date(),
          emotionalTone: null,
          sentimentScore: null,
          stressLevel: null,
          recommendedAction: null,
        },
        aiResponse: {
          id: `${tempId}-ai`,
          reflectionId: tempId,
          role: 'assistant',
          content: aiResponseData.text,
          timestamp: new Date(),
          aiModel: 'claude-3-5-sonnet-20241022',
          tokensUsed: aiResponseData.tokensUsed,
        },
      };
    }

    // 일반 사용자: 데이터베이스에 저장
    // 감정 분석
    const emotionAnalysis = await claudeClient.analyzeEmotion(data.content);

    // 회고 생성
    const reflection = await prisma.reflection.create({
      data: {
        userId,
        title: data.title || this.generateTitle(data.content),
        content: data.content,
        emotionalTone: emotionAnalysis.emotionalTone,
        sentimentScore: emotionAnalysis.sentimentScore,
        stressLevel: emotionAnalysis.stressLevel,
      },
    });

    // 사용자 메시지 저장
    await prisma.conversation.create({
      data: {
        reflectionId: reflection.id,
        role: 'user',
        content: data.content,
      },
    });

    // AI 응답 생성
    const aiResponseData = await claudeClient.getReframingResponse(
      [{ role: 'user', content: data.content }],
      data.emotionTag as EmotionTag
    );

    // AI 응답 저장
    const aiConversation = await prisma.conversation.create({
      data: {
        reflectionId: reflection.id,
        role: 'assistant',
        content: aiResponseData.text,
        aiModel: 'claude-3-5-sonnet-20241022',
        tokensUsed: aiResponseData.tokensUsed,
      },
    });

    return {
      reflection: this.mapReflectionToResponse(reflection),
      aiResponse: this.mapConversationToResponse(aiConversation),
    };
  }

  /**
   * 기존 회고에 메시지 추가 (멀티턴 대화)
   */
  async sendMessage(
    userId: string,
    data: SendMessageInput
  ): Promise<ConversationResponse> {
    // 회고 소유권 확인
    const reflection = await prisma.reflection.findFirst({
      where: {
        id: data.reflectionId,
        userId,
      },
    });

    if (!reflection) {
      throw new Error('회고를 찾을 수 없거나 접근 권한이 없습니다');
    }

    // 기존 대화 히스토리 가져오기 (최근 10개)
    const conversationHistory = await prisma.conversation.findMany({
      where: { reflectionId: data.reflectionId },
      orderBy: { timestamp: 'asc' },
      take: 10,
    });

    // 사용자 메시지 저장
    await prisma.conversation.create({
      data: {
        reflectionId: data.reflectionId,
        role: 'user',
        content: data.content,
      },
    });

    // 대화 히스토리를 Claude API 형식으로 변환
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: data.content,
      },
    ];

    // AI 응답 생성
    const aiResponseData = await claudeClient.getReframingResponse(
      messages,
      reflection.emotionalTone as EmotionTag
    );

    // AI 응답 저장
    const aiConversation = await prisma.conversation.create({
      data: {
        reflectionId: data.reflectionId,
        role: 'assistant',
        content: aiResponseData.text,
        aiModel: 'claude-3-5-sonnet-20241022',
        tokensUsed: aiResponseData.tokensUsed,
      },
    });

    return this.mapConversationToResponse(aiConversation);
  }

  /**
   * 상담 마무리 - 추천 액션 생성
   */
  async endSession(
    userId: string,
    reflectionId: string
  ): Promise<{ recommendedAction: string }> {
    const reflection = await prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        userId,
      },
      include: {
        conversations: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!reflection) {
      throw new Error('회고를 찾을 수 없거나 접근 권한이 없습니다');
    }

    // 이미 추천 액션이 있으면 기존 것을 반환
    if (reflection.recommendedAction) {
      return { recommendedAction: reflection.recommendedAction };
    }

    // 대화 히스토리를 Claude API 형식으로 변환
    const messages = reflection.conversations.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // AI로 추천 액션 생성
    const result = await claudeClient.generateRecommendedAction(
      messages,
      reflection.emotionalTone as EmotionTag
    );

    // DB에 저장
    await prisma.reflection.update({
      where: { id: reflectionId },
      data: { recommendedAction: result.text },
    });

    return { recommendedAction: result.text };
  }

  /**
   * 회고 목록 조회 (페이지네이션, 필터링)
   */
  async getReflections(
    userId: string,
    query: ReflectionListQuery
  ): Promise<{
    reflections: ReflectionResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.emotionTag) {
      where.emotionalTone = query.emotionTag;
    }

    if (query.search) {
      where.OR = [
        { content: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [reflections, total] = await Promise.all([
      prisma.reflection.findMany({
        where,
        include: {
          _count: {
            select: { conversations: true },
          },
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.reflection.count({ where }),
    ]);

    return {
      reflections: reflections.map((r) =>
        this.mapReflectionToResponse(r, r._count.conversations)
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 회고 상세 조회 (대화 포함)
   */
  async getReflectionById(
    userId: string,
    reflectionId: string
  ): Promise<{
    reflection: ReflectionResponse;
    conversations: ConversationResponse[];
  }> {
    const reflection = await prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        userId,
      },
      include: {
        conversations: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!reflection) {
      throw new Error('회고를 찾을 수 없거나 접근 권한이 없습니다');
    }

    return {
      reflection: this.mapReflectionToResponse(reflection),
      conversations: reflection.conversations.map((c) =>
        this.mapConversationToResponse(c)
      ),
    };
  }

  /**
   * 회고 삭제
   */
  async deleteReflection(userId: string, reflectionId: string): Promise<void> {
    const reflection = await prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        userId,
      },
    });

    if (!reflection) {
      throw new Error('회고를 찾을 수 없거나 접근 권한이 없습니다');
    }

    await prisma.reflection.delete({
      where: { id: reflectionId },
    });
  }

  /**
   * 제목 자동 생성 (첫 50자)
   */
  private generateTitle(content: string): string {
    const cleaned = content.trim().replace(/\s+/g, ' ');
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  }

  /**
   * Reflection 엔티티를 응답 DTO로 변환
   */
  private mapReflectionToResponse(
    reflection: any,
    conversationCount?: number
  ): ReflectionResponse {
    return {
      id: reflection.id,
      userId: reflection.userId,
      title: reflection.title,
      content: reflection.content,
      emotionalTone: reflection.emotionalTone,
      sentimentScore: reflection.sentimentScore,
      stressLevel: reflection.stressLevel,
      recommendedAction: reflection.recommendedAction ?? null,
      createdAt: reflection.createdAt,
      updatedAt: reflection.updatedAt,
      conversationCount,
    };
  }

  /**
   * Conversation 엔티티를 응답 DTO로 변환
   */
  private mapConversationToResponse(conversation: any): ConversationResponse {
    return {
      id: conversation.id,
      reflectionId: conversation.reflectionId,
      role: conversation.role,
      content: conversation.content,
      timestamp: conversation.timestamp,
      aiModel: conversation.aiModel,
      tokensUsed: conversation.tokensUsed,
    };
  }
}

export const reflectionService = new ReflectionService();
