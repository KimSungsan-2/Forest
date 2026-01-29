import { prisma } from '../../../config/database';
import { EMOTION_TAGS_KR, EmotionTag } from './prompts';

const LOOKBACK_DAYS = 30;
const MAX_CANDIDATES = 10;
const MAX_RESULTS = 3;
const MAX_SUMMARY_LENGTH = 150;

// 관련도 점수를 위한 키워드 목록
const PARENTING_KEYWORDS = [
  '소리', '화', '짜증', '울', '아이', '아들', '딸',
  '학교', '숙제', '밥', '잠', '놀이', '훈육', '사과',
  '미안', '후회', '죄책감', '피곤', '지쳐', '힘들',
  '불안', '걱정', '외로', '슬프', '답답', '막막',
];

interface ReflectionWithConversations {
  id: string;
  content: string;
  emotionalTone: string | null;
  createdAt: Date;
  conversations: {
    role: string;
    content: string;
  }[];
}

interface ScoredReflection {
  reflection: ReflectionWithConversations;
  score: number;
}

/**
 * 사용자의 과거 회고 중 관련도가 높은 것을 검색
 */
export async function retrievePastReflections(
  userId: string,
  currentContent: string,
  currentEmotion?: string,
  excludeReflectionId?: string,
): Promise<ReflectionWithConversations[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOOKBACK_DAYS);

  const where: any = {
    userId,
    createdAt: { gte: cutoffDate },
  };

  if (excludeReflectionId) {
    where.id = { not: excludeReflectionId };
  }

  const candidates = await prisma.reflection.findMany({
    where,
    include: {
      conversations: {
        where: { role: 'assistant' },
        orderBy: { timestamp: 'asc' as const },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_CANDIDATES,
  });

  if (candidates.length === 0) return [];

  // 관련도 점수 계산 후 정렬
  const scored: ScoredReflection[] = candidates.map((r) => ({
    reflection: r,
    score: calculateRelevanceScore(r, currentContent, currentEmotion),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RESULTS).map((s) => s.reflection);
}

/**
 * 관련도 점수 계산
 * - 감정 일치: +10
 * - 7일 이내: +5, 14일 이내: +3, 30일 이내: +1
 * - 키워드 겹침: 겹치는 키워드당 +2
 */
function calculateRelevanceScore(
  reflection: ReflectionWithConversations,
  currentContent: string,
  currentEmotion?: string,
): number {
  let score = 0;

  // 감정 일치
  if (currentEmotion && reflection.emotionalTone === currentEmotion) {
    score += 10;
  }

  // 최신도
  const daysDiff = Math.floor(
    (Date.now() - reflection.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff <= 7) score += 5;
  else if (daysDiff <= 14) score += 3;
  else score += 1;

  // 키워드 겹침
  const currentKeywords = PARENTING_KEYWORDS.filter((kw) =>
    currentContent.includes(kw),
  );
  const pastKeywords = PARENTING_KEYWORDS.filter((kw) =>
    reflection.content.includes(kw),
  );
  const overlap = currentKeywords.filter((kw) => pastKeywords.includes(kw));
  score += overlap.length * 2;

  return score;
}

/**
 * 과거 회고를 요약 문자열로 변환
 */
function summarizeReflection(reflection: ReflectionWithConversations): string {
  const date = reflection.createdAt;
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  const emotionLabel = reflection.emotionalTone
    ? EMOTION_TAGS_KR[reflection.emotionalTone as EmotionTag] || reflection.emotionalTone
    : '기타';

  // 사용자 내용 요약 (50자)
  const contentSummary = reflection.content.length > 50
    ? reflection.content.substring(0, 50) + '...'
    : reflection.content;

  // AI 첫 응답의 핵심 메시지 추출 (첫 문장, 50자)
  let aiSummary = '';
  const aiResponse = reflection.conversations[0];
  if (aiResponse) {
    // ==킬링 문장== 추출 우선
    const killingMatch = aiResponse.content.match(/==(.+?)==/);
    if (killingMatch) {
      aiSummary = killingMatch[1].substring(0, 50);
    } else {
      // 첫 문장 추출
      const firstSentence = aiResponse.content.split(/[.。!？\n]/)[0] || '';
      aiSummary = firstSentence.substring(0, 50);
    }
  }

  const summary = aiSummary
    ? `[${dateStr}] [${emotionLabel}] ${contentSummary} → "${aiSummary}"`
    : `[${dateStr}] [${emotionLabel}] ${contentSummary}`;

  return summary.length > MAX_SUMMARY_LENGTH
    ? summary.substring(0, MAX_SUMMARY_LENGTH) + '...'
    : summary;
}

/**
 * 과거 맥락을 시스템 프롬프트용 문자열로 빌드
 */
export async function buildPastContextPrompt(
  userId: string,
  currentContent: string,
  currentEmotion?: string,
  excludeReflectionId?: string,
): Promise<string | undefined> {
  const pastReflections = await retrievePastReflections(
    userId,
    currentContent,
    currentEmotion,
    excludeReflectionId,
  );

  if (pastReflections.length === 0) return undefined;

  const summaries = pastReflections.map(summarizeReflection);

  return `\n\n**사용자의 과거 회고 맥락:**
다음은 이 사용자가 이전에 나눈 상담 내용입니다. 자연스럽게 참고하세요.

${summaries.map((s) => `- ${s}`).join('\n')}

**지시:** 반복 패턴이 보이면 부드럽게 언급하고 ("지난번에도 비슷한 감정을 느꼈었죠..."), 이전 인사이트와 연결하세요. 과거를 들먹이며 비난하는 톤은 절대 금지입니다. 과거 맥락이 현재 상황과 관련 없으면 언급하지 마세요.`;
}
