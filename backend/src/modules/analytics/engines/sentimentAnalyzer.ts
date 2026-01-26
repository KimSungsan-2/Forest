import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export interface SentimentAnalysisResult {
  score: number; // -5 to 5 (positive/negative)
  comparative: number; // -1 to 1 (normalized)
  positiveWords: string[];
  negativeWords: string[];
  negativityRate: number; // 0 to 1 (% of negative words)
}

/**
 * 텍스트의 감정을 분석합니다
 */
export function analyzeSentiment(text: string): SentimentAnalysisResult {
  const result = sentiment.analyze(text);

  const totalWords = text.split(/\s+/).length;
  const negativeWordCount = result.negative.length;
  const negativityRate = totalWords > 0 ? negativeWordCount / totalWords : 0;

  return {
    score: result.score,
    comparative: result.comparative,
    positiveWords: result.positive,
    negativeWords: result.negative,
    negativityRate,
  };
}

/**
 * 여러 회고의 평균 감정을 계산합니다
 */
export function calculateAverageSentiment(
  reflections: Array<{ content: string }>
): number {
  if (reflections.length === 0) return 0;

  const totalComparative = reflections.reduce((sum, reflection) => {
    const analysis = analyzeSentiment(reflection.content);
    return sum + analysis.comparative;
  }, 0);

  return totalComparative / reflections.length;
}

/**
 * 한국어 부정적 키워드 감지
 * (sentiment 패키지는 영어 기반이므로 한국어 키워드를 추가)
 */
const KOREAN_NEGATIVE_KEYWORDS = [
  '죄책감',
  '미안',
  '후회',
  '자책',
  '형편없',
  '최악',
  '실패',
  '포기',
  '지쳐',
  '피곤',
  '힘들',
  '우울',
  '불안',
  '두렵',
  '외롭',
  '슬프',
  '아프',
  '화',
  '짜증',
  '분노',
  '소리',
  '질렀',
  '때렸',
  '욱',
];

const KOREAN_POSITIVE_KEYWORDS = [
  '행복',
  '좋았',
  '즐거',
  '웃',
  '사랑',
  '고마',
  '감사',
  '성공',
  '잘했',
  '발전',
  '성장',
  '희망',
  '기쁨',
  '편안',
];

/**
 * 한국어 텍스트의 부정성 비율 계산
 */
export function calculateKoreanNegativityRate(text: string): number {
  const words = text.split(/\s+/);
  const negativeCount = words.filter((word) =>
    KOREAN_NEGATIVE_KEYWORDS.some((keyword) => word.includes(keyword))
  ).length;

  return words.length > 0 ? negativeCount / words.length : 0;
}

/**
 * 한국어 감정 점수 계산 (-1 to 1)
 */
export function calculateKoreanSentimentScore(text: string): number {
  const words = text.split(/\s+/);

  const negativeCount = words.filter((word) =>
    KOREAN_NEGATIVE_KEYWORDS.some((keyword) => word.includes(keyword))
  ).length;

  const positiveCount = words.filter((word) =>
    KOREAN_POSITIVE_KEYWORDS.some((keyword) => word.includes(keyword))
  ).length;

  const totalSentimentWords = negativeCount + positiveCount;

  if (totalSentimentWords === 0) return 0;

  return (positiveCount - negativeCount) / totalSentimentWords;
}
