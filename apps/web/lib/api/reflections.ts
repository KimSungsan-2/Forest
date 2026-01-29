import { apiRequest } from './client';
import type {
  Reflection,
  CreateReflectionRequest,
  SendMessageRequest,
  Conversation,
  ReflectionListResponse,
  ReflectionDetailResponse,
} from '../../../../shared/types/reflection';

export const reflectionApi = {
  /**
   * 새로운 회고 생성
   */
  create: async (
    data: CreateReflectionRequest
  ): Promise<{
    reflection: Reflection;
    aiResponse: Conversation;
  }> => {
    return apiRequest('/api/reflections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 회고 목록 조회
   */
  list: async (params?: {
    page?: number;
    limit?: number;
    emotionTag?: string;
    search?: string;
  }): Promise<ReflectionListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.emotionTag) query.append('emotionTag', params.emotionTag);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return apiRequest(`/api/reflections${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * 회고 상세 조회
   */
  getById: async (id: string): Promise<ReflectionDetailResponse> => {
    return apiRequest(`/api/reflections/${id}`);
  },

  /**
   * 회고 삭제
   */
  delete: async (id: string): Promise<void> => {
    return apiRequest(`/api/reflections/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 상담 마무리 - 추천 액션 생성
   */
  endSession: async (id: string): Promise<{ recommendedAction: string }> => {
    return apiRequest(`/api/reflections/${id}/end-session`, {
      method: 'POST',
    });
  },

  /**
   * 메시지 전송 (비스트리밍)
   */
  sendMessage: async (data: SendMessageRequest): Promise<Conversation> => {
    return apiRequest('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 메시지 전송 (스트리밍)
   *
   * @param data - 메시지 데이터
   * @param onChunk - 각 텍스트 청크를 받을 콜백
   * @param onComplete - 완료 시 호출될 콜백
   */
  streamMessage: async (
    data: SendMessageRequest,
    onChunk: (text: string) => void,
    onComplete?: () => void
  ): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to stream message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (onComplete) onComplete();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));

          if (data.text) {
            onChunk(data.text);
          }

          if (data.done) {
            if (onComplete) onComplete();
            return;
          }
        }
      }
    }
  },
};
