import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../../config/env';
import {
  COGNITIVE_REFRAMING_SYSTEM_PROMPT,
  FOLLOW_UP_CONVERSATION_CONTEXT,
  getEmotionSpecificPrompt,
  getCounselingStylePrompt,
  EmotionTag,
  CounselingStyle,
} from './prompts';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

const MODEL = 'claude-3-haiku-20240307';
const MAX_TOKENS = 4096;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'content_block_delta' | 'message_stop';
  delta?: {
    type: 'text_delta';
    text: string;
  };
}

/**
 * Claude API를 사용한 인지 재구조화 응답 생성
 */
export class ClaudeClient {
  /**
   * 스트리밍 응답 생성
   *
   * @param messages - 대화 히스토리
   * @param emotion - 선택적 감정 태그
   * @param onChunk - 각 텍스트 청크를 받을 콜백
   * @returns 전체 응답 텍스트 및 사용된 토큰 수
   */
  async streamReframingResponse(
    messages: Message[],
    emotion?: EmotionTag,
    onChunk?: (text: string) => void,
    pastContext?: string,
    counselingStyle?: CounselingStyle
  ): Promise<{ text: string; tokensUsed: number }> {
    const isFollowUp = messages.length > 1;

    const systemPrompt =
      COGNITIVE_REFRAMING_SYSTEM_PROMPT +
      (isFollowUp ? `\n\n${FOLLOW_UP_CONVERSATION_CONTEXT}` : '') +
      (emotion ? getEmotionSpecificPrompt(emotion) : '') +
      getCounselingStylePrompt(counselingStyle) +
      (pastContext || '');

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // 스트림 이벤트 처리
    stream.on('text', (text) => {
      fullText += text;
      if (onChunk) {
        onChunk(text);
      }
    });

    stream.on('message', (message) => {
      if (message.usage) {
        inputTokens = message.usage.input_tokens;
        outputTokens = message.usage.output_tokens;
      }
    });

    // 스트림 완료 대기
    await stream.finalMessage();

    return {
      text: fullText,
      tokensUsed: inputTokens + outputTokens,
    };
  }

  /**
   * 비스트리밍 응답 생성 (테스트용)
   */
  async getReframingResponse(
    messages: Message[],
    emotion?: EmotionTag,
    pastContext?: string,
    counselingStyle?: CounselingStyle
  ): Promise<{ text: string; tokensUsed: number }> {
    const isFollowUp = messages.length > 1;

    const systemPrompt =
      COGNITIVE_REFRAMING_SYSTEM_PROMPT +
      (isFollowUp ? `\n\n${FOLLOW_UP_CONVERSATION_CONTEXT}` : '') +
      (emotion ? getEmotionSpecificPrompt(emotion) : '') +
      getCounselingStylePrompt(counselingStyle) +
      (pastContext || '');

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const text = textContent && 'text' in textContent ? textContent.text : '';

    return {
      text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  /**
   * 상담 마무리 시 추천 액션 생성
   *
   * 대화 내용을 기반으로 내일 실천할 수 있는 구체적인 활동이나 말을 추천합니다.
   */
  async generateRecommendedAction(
    conversations: Message[],
    emotion?: EmotionTag
  ): Promise<{ text: string; tokensUsed: number }> {
    const systemPrompt = `당신은 부모의 감정 지원 동반자입니다. 지금까지의 상담 대화를 바탕으로, 내일 실천할 수 있는 **구체적인 추천 액션 1가지**를 제안해주세요.

**형식:**
- "내일은 [구체적인 활동]을 해보세요." 또는 "내일은 아이에게 '[구체적인 말]'이라고 말해보세요." 형태로 작성
- 반드시 대화 내용과 관련된 맞춤형 제안이어야 합니다
- 짧고 실천 가능한 것이어야 합니다 (1-2문장)

**예시:**
- "내일은 아이와 10분간 함께 그림을 그려보세요. 완벽하지 않아도, 함께하는 시간 자체가 선물이에요."
- "내일은 아이에게 '엄마(아빠)가 어제 소리 질러서 미안해. 너를 정말 사랑해'라고 말해보세요."
- "내일은 퇴근 후 5분만 혼자 깊게 숨을 쉬는 시간을 가져보세요. 당신도 쉴 자격이 있어요."
- "내일은 아이가 말할 때 핸드폰을 내려놓고 눈을 맞추며 들어보세요. 작은 변화가 큰 연결을 만들어요."

**규칙:**
- 반드시 한국어로 응답
- 교훈적이거나 설교하는 톤 금지
- 따뜻하고 격려하는 톤
- 추천 액션만 출력 (다른 인사말이나 부가 설명 없이)`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: systemPrompt,
      messages: conversations.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const text = textContent && 'text' in textContent ? textContent.text : '';

    return {
      text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  /**
   * 감정 분석 (간단한 키워드 기반)
   *
   * Claude API를 사용한 더 정교한 감정 분석도 가능하지만,
   * 비용 절감을 위해 키워드 기반 분석을 먼저 사용합니다.
   */
  async analyzeEmotion(text: string): Promise<{
    emotionalTone: string;
    sentimentScore: number;
    stressLevel: number;
  }> {
    const lowerText = text.toLowerCase();

    // 감정 키워드 매칭
    const emotionKeywords: Record<string, string[]> = {
      guilt: ['죄책감', '미안', '잘못', '후회', '부끄럽', 'guilty', 'sorry', 'regret'],
      anger: ['화', '짜증', '분노', '열받', 'angry', 'mad', 'furious'],
      exhaustion: ['피곤', '지쳐', '힘들', '지침', 'tired', 'exhausted', 'drained'],
      anxiety: ['불안', '걱정', '두렵', '초조', 'anxious', 'worried', 'nervous'],
      sadness: ['슬프', '우울', '외로', '눈물', 'sad', 'depressed', 'lonely'],
      frustration: ['답답', '막막', '좌절', 'frustrated', 'stuck'],
    };

    let detectedEmotion = 'neutral';
    let maxMatches = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter((keyword) => lowerText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedEmotion = emotion;
      }
    }

    // 부정적 단어 카운트로 감정 점수 계산
    const negativeWords = [
      '못',
      '안',
      '나쁜',
      '형편없',
      '실패',
      '문제',
      '힘들',
      'bad',
      'terrible',
      'fail',
      'problem',
    ];
    const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

    const sentimentScore = Math.max(-1, -0.1 * negativeCount);
    const stressLevel = Math.min(10, Math.floor(negativeCount / 2) + 3);

    return {
      emotionalTone: detectedEmotion,
      sentimentScore,
      stressLevel,
    };
  }
}

export const claudeClient = new ClaudeClient();
