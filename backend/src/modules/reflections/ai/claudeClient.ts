import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../../config/env';
import {
  COGNITIVE_REFRAMING_SYSTEM_PROMPT,
  FOLLOW_UP_CONVERSATION_CONTEXT,
  getEmotionSpecificPrompt,
  EmotionTag,
} from './prompts';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

const MODEL = 'claude-3-haiku-20240307';
const MAX_TOKENS = 1024;

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
    onChunk?: (text: string) => void
  ): Promise<{ text: string; tokensUsed: number }> {
    const isFollowUp = messages.length > 1;

    const systemPrompt =
      COGNITIVE_REFRAMING_SYSTEM_PROMPT +
      (isFollowUp ? `\n\n${FOLLOW_UP_CONVERSATION_CONTEXT}` : '') +
      (emotion ? getEmotionSpecificPrompt(emotion) : '');

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
    emotion?: EmotionTag
  ): Promise<{ text: string; tokensUsed: number }> {
    const isFollowUp = messages.length > 1;

    const systemPrompt =
      COGNITIVE_REFRAMING_SYSTEM_PROMPT +
      (isFollowUp ? `\n\n${FOLLOW_UP_CONVERSATION_CONTEXT}` : '') +
      (emotion ? getEmotionSpecificPrompt(emotion) : '');

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
