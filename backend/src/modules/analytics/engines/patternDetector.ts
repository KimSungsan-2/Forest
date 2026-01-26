/**
 * 패턴 감지 엔진
 * - 반복되는 테마 감지
 * - 단어 빈도 분석
 * - 행동 패턴 추출
 */

export interface WordFrequency {
  [word: string]: number;
}

export interface RepetitiveTheme {
  theme: string;
  count: number;
  percentage: number;
}

/**
 * 한국어 불용어 (분석에서 제외할 단어들)
 */
const KOREAN_STOP_WORDS = new Set([
  '이',
  '그',
  '저',
  '것',
  '수',
  '등',
  '들',
  '및',
  '또는',
  '그리고',
  '하지만',
  '그런데',
  '그러나',
  '때문',
  '위해',
  '대해',
  '통해',
  '관해',
  '있다',
  '없다',
  '이다',
  '아니다',
  '되다',
  '하다',
  '그냥',
  '정말',
  '너무',
  '아주',
  '매우',
  '참',
  '정말로',
]);

/**
 * 부모의 감정 관련 테마 키워드
 */
const PARENTING_THEMES = {
  소리지름: ['소리', '질렀', '화냈', '고함', '욱'],
  체벌: ['때렸', '때리', '손찌검', '회초리', '벌'],
  죄책감: ['미안', '죄책감', '자책', '후회', '형편없'],
  피로: ['피곤', '지쳐', '힘들', '녹초', '탈진', '번아웃'],
  시간부족: ['시간', '바쁘', '부족', '여유없', '쫓기'],
  완벽주의: ['완벽', '제대로', '잘못', '실수', '틀렸'],
  비교: ['다른엄마', '남들', '비교', '뒤처져', '못하는'],
  외로움: ['혼자', '외롭', '고립', '이해받지', '들어주지'],
};

/**
 * 텍스트에서 단어 빈도 계산
 */
export function calculateWordFrequency(
  texts: string[],
  topN: number = 20
): WordFrequency {
  const wordCounts: { [word: string]: number } = {};

  texts.forEach((text) => {
    const words = text
      .replace(/[^\uAC00-\uD7A3\s]/g, '') // 한글과 공백만
      .split(/\s+/)
      .filter((word) => word.length >= 2 && !KOREAN_STOP_WORDS.has(word));

    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  // 빈도순 정렬 후 상위 N개
  const sorted = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);

  return Object.fromEntries(sorted);
}

/**
 * 반복적인 테마 감지
 */
export function detectRepetitiveThemes(
  texts: string[]
): { [theme: string]: number } {
  const themeCounts: { [theme: string]: number } = {};

  texts.forEach((text) => {
    Object.entries(PARENTING_THEMES).forEach(([theme, keywords]) => {
      const hasTheme = keywords.some((keyword) => text.includes(keyword));
      if (hasTheme) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    });
  });

  return themeCounts;
}

/**
 * 특정 테마의 빈도 비율 계산
 */
export function calculateThemePercentages(
  themeCounts: { [theme: string]: number },
  totalReflections: number
): RepetitiveTheme[] {
  return Object.entries(themeCounts)
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: (count / totalReflections) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 행동 패턴 추출
 */
export function extractBehaviorPatterns(texts: string[]): {
  triggers: string[]; // 촉발 요인
  responses: string[]; // 반응 패턴
} {
  const triggers: string[] = [];
  const responses: string[] = [];

  const TRIGGER_PATTERNS = [
    /때문에/,
    /~해서/,
    /~라서/,
    /~니까/,
    /이유는/,
  ];

  const RESPONSE_PATTERNS = [
    /질렀/,
    /화냈/,
    /때렸/,
    /소리쳤/,
    /욱했/,
    /폭발했/,
  ];

  texts.forEach((text) => {
    const sentences = text.split(/[.!?]/);

    sentences.forEach((sentence) => {
      if (TRIGGER_PATTERNS.some((pattern) => pattern.test(sentence))) {
        triggers.push(sentence.trim());
      }
      if (RESPONSE_PATTERNS.some((pattern) => pattern.test(sentence))) {
        responses.push(sentence.trim());
      }
    });
  });

  return {
    triggers: [...new Set(triggers)].slice(0, 10), // 중복 제거 후 상위 10개
    responses: [...new Set(responses)].slice(0, 10),
  };
}

/**
 * 다양성 점수 계산 (0-1)
 * 높을수록 다양한 주제를 다루고 있음
 */
export function calculateDiversityScore(themeCounts: {
  [theme: string]: number;
}): number {
  const values = Object.values(themeCounts);
  if (values.length === 0) return 0;

  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return 0;

  // Shannon Entropy 계산
  const entropy = values.reduce((sum, val) => {
    const p = val / total;
    return sum - p * Math.log2(p);
  }, 0);

  const maxEntropy = Math.log2(values.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}
