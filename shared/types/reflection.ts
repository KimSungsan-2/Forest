export type EmotionTag =
  | 'guilt'
  | 'anger'
  | 'exhaustion'
  | 'anxiety'
  | 'sadness'
  | 'frustration'
  | 'overwhelm'
  | 'loneliness';

export type CounselingStyle = 'humorous' | 'nurturing' | 'direct';

export interface Reflection {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  emotionalTone: string | null;
  sentimentScore: number | null;
  stressLevel: number | null;
  recommendedAction: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  conversationCount?: number;
}

export interface Conversation {
  id: string;
  reflectionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  aiModel?: string | null;
  tokensUsed?: number | null;
}

export interface CreateReflectionRequest {
  title?: string;
  content: string;
  emotionTag?: EmotionTag;
  counselingStyle?: CounselingStyle;
}

export interface SendMessageRequest {
  reflectionId: string;
  content: string;
  counselingStyle?: CounselingStyle;
}

export interface ReflectionListResponse {
  reflections: Reflection[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReflectionDetailResponse {
  reflection: Reflection;
  conversations: Conversation[];
}
