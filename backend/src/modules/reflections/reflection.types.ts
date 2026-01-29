import { z } from 'zod';
import { EmotionTag } from './ai/prompts';

/**
 * 회고 생성 스키마
 */
export const createReflectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1, '내용을 입력해주세요').max(5000),
  emotionTag: z
    .enum(['guilt', 'anger', 'exhaustion', 'anxiety', 'sadness', 'frustration', 'overwhelm', 'loneliness'])
    .optional(),
});

/**
 * 채팅 메시지 전송 스키마
 */
export const sendMessageSchema = z.object({
  reflectionId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * 회고 응답 타입
 */
export interface ReflectionResponse {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  emotionalTone: string | null;
  sentimentScore: number | null;
  stressLevel: number | null;
  recommendedAction: string | null;
  createdAt: Date;
  updatedAt: Date;
  conversationCount?: number;
}

/**
 * 대화 응답 타입
 */
export interface ConversationResponse {
  id: string;
  reflectionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiModel?: string | null;
  tokensUsed?: number | null;
}

/**
 * 회고 목록 쿼리 파라미터
 */
export interface ReflectionListQuery {
  page?: number;
  limit?: number;
  emotionTag?: EmotionTag;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
