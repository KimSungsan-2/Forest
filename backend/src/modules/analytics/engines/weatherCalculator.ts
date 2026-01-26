import {
  calculateKoreanNegativityRate,
  calculateKoreanSentimentScore,
  calculateAverageSentiment,
} from './sentimentAnalyzer';
import {
  calculateWordFrequency,
  detectRepetitiveThemes,
  calculateDiversityScore,
} from './patternDetector';

export type BurnoutRisk = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface MindWeatherScore {
  overallScore: number; // 0-100 (높을수록 좋은 상태)
  burnoutRisk: BurnoutRisk;
  negativityRate: number; // 0-1
  sentimentAverage: number; // -1 to 1
  diversityScore: number; // 0-1
  reflectionFrequency: number; // 최근 7일 회고 수
  repetitiveThemes: { [theme: string]: number };
  wordFrequency: { [word: string]: number };
  recommendations: string[];
  trendDirection: TrendDirection;
}

interface ReflectionData {
  content: string;
  createdAt: Date;
  sentimentScore?: number | null;
}

/**
 * 마음 날씨 지수 계산
 */
export function calculateMindWeather(
  reflections: ReflectionData[],
  previousScore?: MindWeatherScore
): MindWeatherScore {
  if (reflections.length === 0) {
    return getDefaultScore();
  }

  // 1. 부정성 비율 계산
  const texts = reflections.map((r) => r.content);
  const avgNegativityRate =
    texts.reduce((sum, text) => sum + calculateKoreanNegativityRate(text), 0) /
    texts.length;

  // 2. 감정 점수 평균
  const sentimentAverage =
    texts.reduce((sum, text) => sum + calculateKoreanSentimentScore(text), 0) /
    texts.length;

  // 3. 다양성 점수
  const repetitiveThemes = detectRepetitiveThemes(texts);
  const diversityScore = calculateDiversityScore(repetitiveThemes);

  // 4. 회고 빈도 (최근 7일)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentReflections = reflections.filter(
    (r) => new Date(r.createdAt) >= sevenDaysAgo
  );
  const reflectionFrequency = recentReflections.length;

  // 5. 종합 점수 계산 (0-100)
  const overallScore = calculateOverallScore({
    negativityRate: avgNegativityRate,
    sentimentAverage,
    diversityScore,
    reflectionFrequency,
  });

  // 6. 번아웃 위험도
  const burnoutRisk = calculateBurnoutRisk(overallScore, repetitiveThemes);

  // 7. 트렌드 방향
  const trendDirection = calculateTrendDirection(
    overallScore,
    previousScore?.overallScore
  );

  // 8. 단어 빈도
  const wordFrequency = calculateWordFrequency(texts, 20);

  // 9. 추천사항 생성
  const recommendations = generateRecommendations({
    overallScore,
    burnoutRisk,
    repetitiveThemes,
    diversityScore,
    reflectionFrequency,
  });

  return {
    overallScore,
    burnoutRisk,
    negativityRate: avgNegativityRate,
    sentimentAverage,
    diversityScore,
    reflectionFrequency,
    repetitiveThemes,
    wordFrequency,
    recommendations,
    trendDirection,
  };
}

/**
 * 종합 점수 계산
 * 알고리즘:
 * - 부정성 비율이 낮을수록 점수 높음 (40%)
 * - 감정 점수가 높을수록 점수 높음 (30%)
 * - 다양성이 높을수록 점수 높음 (20%)
 * - 회고 빈도가 적절할수록 점수 높음 (10%)
 */
function calculateOverallScore(metrics: {
  negativityRate: number;
  sentimentAverage: number;
  diversityScore: number;
  reflectionFrequency: number;
}): number {
  const {
    negativityRate,
    sentimentAverage,
    diversityScore,
    reflectionFrequency,
  } = metrics;

  // 1. 부정성 비율 점수 (낮을수록 좋음, 0-40점)
  const negativityScore = (1 - Math.min(negativityRate, 1)) * 40;

  // 2. 감정 점수 (-1~1 -> 0-30점)
  const sentimentScore = ((sentimentAverage + 1) / 2) * 30;

  // 3. 다양성 점수 (0-1 -> 0-20점)
  const diversityPoints = diversityScore * 20;

  // 4. 회고 빈도 점수 (3-5회/주가 이상적, 0-10점)
  let frequencyScore = 0;
  if (reflectionFrequency >= 3 && reflectionFrequency <= 5) {
    frequencyScore = 10; // 이상적
  } else if (reflectionFrequency >= 1 && reflectionFrequency <= 7) {
    frequencyScore = 7; // 괜찮음
  } else if (reflectionFrequency > 7) {
    frequencyScore = 4; // 너무 많음 (스트레스 가능성)
  } else {
    frequencyScore = 2; // 너무 적음
  }

  const total =
    negativityScore + sentimentScore + diversityPoints + frequencyScore;

  return Math.max(0, Math.min(100, total)); // 0-100 범위로 제한
}

/**
 * 번아웃 위험도 계산
 */
function calculateBurnoutRisk(
  score: number,
  themes: { [theme: string]: number }
): BurnoutRisk {
  // 고위험 테마 체크
  const highRiskThemes = ['피로', '소리지름', '죄책감'];
  const highRiskCount = highRiskThemes.reduce(
    (sum, theme) => sum + (themes[theme] || 0),
    0
  );

  if (score < 30 || highRiskCount >= 5) return 'critical';
  if (score < 50 || highRiskCount >= 3) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

/**
 * 트렌드 방향 계산
 */
function calculateTrendDirection(
  currentScore: number,
  previousScore?: number
): TrendDirection {
  if (!previousScore) return 'stable';

  const diff = currentScore - previousScore;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * 추천사항 생성
 */
function generateRecommendations(data: {
  overallScore: number;
  burnoutRisk: BurnoutRisk;
  repetitiveThemes: { [theme: string]: number };
  diversityScore: number;
  reflectionFrequency: number;
}): string[] {
  const recommendations: string[] = [];

  // 번아웃 위험도에 따른 권장사항
  if (data.burnoutRisk === 'critical') {
    recommendations.push(
      '⚠️ 긴급: 전문가 상담을 고려해보세요. 혼자 견디기 어려운 상태일 수 있습니다.'
    );
    recommendations.push(
      '가족이나 친구에게 도움을 요청하거나, 잠시 휴식을 취할 방법을 찾아보세요.'
    );
  } else if (data.burnoutRisk === 'high') {
    recommendations.push(
      '스트레스가 높은 상태입니다. 하루 10-15분 자신만의 시간을 가져보세요.'
    );
  }

  // 반복 테마별 권장사항
  const themes = data.repetitiveThemes;

  if (themes['소리지름'] >= 3) {
    recommendations.push(
      '💬 화가 날 때 10초 심호흡하기, "지금 화가 나는구나" 스스로 인정하기를 시도해보세요.'
    );
  }

  if (themes['죄책감'] >= 3) {
    recommendations.push(
      '💚 자책보다는 "다음엔 이렇게 해볼까"라는 성장 관점으로 생각해보세요. 완벽한 부모는 없습니다.'
    );
  }

  if (themes['피로'] >= 4) {
    recommendations.push(
      '😴 충분한 휴식이 필요합니다. 아이가 잠든 후 스마트폰 대신 일찍 자는 것도 방법입니다.'
    );
  }

  if (themes['외로움'] >= 2) {
    recommendations.push(
      '🤝 비슷한 상황의 부모 커뮤니티에 참여해보세요. 당신만 힘든 게 아닙니다.'
    );
  }

  // 다양성이 낮으면
  if (data.diversityScore < 0.3) {
    recommendations.push(
      '📝 같은 패턴이 반복되고 있어요. 작은 변화 하나만 시도해보는 건 어떨까요?'
    );
  }

  // 빈도가 너무 높으면
  if (data.reflectionFrequency > 10) {
    recommendations.push(
      '✍️ 회고가 너무 잦으면 스트레스가 될 수 있어요. 하루 한 번 정도가 적당합니다.'
    );
  }

  // 빈도가 낮으면
  if (data.reflectionFrequency < 1) {
    recommendations.push(
      '📅 규칙적인 회고가 도움이 됩니다. 매일 자기 전 5분만 투자해보세요.'
    );
  }

  // 전반적으로 좋은 상태
  if (data.overallScore >= 70) {
    recommendations.push(
      '✨ 잘 하고 계십니다! 지금의 패턴을 유지하면서 자신을 격려해주세요.'
    );
  }

  return recommendations.slice(0, 5); // 최대 5개
}

/**
 * 기본 점수 (데이터 없을 때)
 */
function getDefaultScore(): MindWeatherScore {
  return {
    overallScore: 50,
    burnoutRisk: 'medium',
    negativityRate: 0,
    sentimentAverage: 0,
    diversityScore: 0,
    reflectionFrequency: 0,
    repetitiveThemes: {},
    wordFrequency: {},
    recommendations: [
      '📝 회고를 시작해보세요. 감정을 글로 표현하는 것만으로도 도움이 됩니다.',
    ],
    trendDirection: 'stable',
  };
}
