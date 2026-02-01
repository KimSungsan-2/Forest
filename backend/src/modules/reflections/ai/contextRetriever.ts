import { prisma } from '../../../config/database';
import { EMOTION_TAGS_KR, EmotionTag } from './prompts';

const LOOKBACK_DAYS = 30;
const MAX_CANDIDATES = 10;
const MAX_RESULTS = 3;
const MAX_SUMMARY_LENGTH = 300;

// 관련도 점수를 위한 키워드 목록
const PARENTING_KEYWORDS = [
  '소리', '화', '짜증', '울', '아이', '아들', '딸',
  '학교', '숙제', '밥', '잠', '놀이', '훈육', '사과',
  '미안', '후회', '죄책감', '피곤', '지쳐', '힘들',
  '불안', '걱정', '외로', '슬프', '답답', '막막',
  '뿌듯', '기쁘', '감사', '행복', '자랑',
];

interface ReflectionWithConversations {
  id: string;
  content: string;
  emotionalTone: string | null;
  recommendedAction: string | null;
  createdAt: Date;
  conversations: {
    role: string;
    content: string;
  }[];
  _count?: {
    conversations: number;
  };
}

interface ScoredReflection {
  reflection: ReflectionWithConversations;
  score: number;
}

interface ChildProfileData {
  name?: string;
  birthDate: string;
  gender?: 'boy' | 'girl' | 'other';
}

interface UserProfileContext {
  displayName: string | null;
  totalReflections: number;
  firstReflectionDate: Date | null;
  topEmotions: { emotion: string; count: number }[];
  recentTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  lastRecommendedAction: string | null;
  parentingType: string | null;
  childProfiles: ChildProfileData[];
}

/**
 * 사용자 프로필 컨텍스트 빌드
 * 총 상담 횟수, 주요 감정, 감정 추이 등을 집계
 */
async function buildUserProfileContext(
  userId: string,
): Promise<UserProfileContext | null> {
  const [user, totalReflections, emotionGroups, recentReflections] =
    await Promise.all([
      prisma.user.findFirst({
        where: { id: userId },
        select: { displayName: true, parentingType: true, childProfiles: true },
      }),
      prisma.reflection.count({ where: { userId } }),
      prisma.reflection.groupBy({
        by: ['emotionalTone'],
        where: { userId, emotionalTone: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 3,
      }),
      prisma.reflection.findMany({
        where: { userId, sentimentScore: { not: null } },
        select: {
          sentimentScore: true,
          createdAt: true,
          recommendedAction: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  if (totalReflections === 0) return null;

  // 첫 상담일
  const firstReflection = await prisma.reflection.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  // 감정 추이: 최근 5건 vs 이전 5건 sentimentScore 비교
  let recentTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown';
  if (recentReflections.length >= 6) {
    const recent5 = recentReflections.slice(0, 5);
    const older5 = recentReflections.slice(5, 10);
    const recentAvg =
      recent5.reduce((s, r) => s + (r.sentimentScore || 0), 0) / recent5.length;
    const olderAvg =
      older5.reduce((s, r) => s + (r.sentimentScore || 0), 0) / older5.length;
    const diff = recentAvg - olderAvg;
    if (diff > 0.15) recentTrend = 'improving';
    else if (diff < -0.15) recentTrend = 'declining';
    else recentTrend = 'stable';
  }

  // 가장 최근 추천 액션
  const lastWithAction = recentReflections.find((r) => r.recommendedAction);

  // 아이 프로필 파싱
  let childProfiles: ChildProfileData[] = [];
  if (user?.childProfiles && Array.isArray(user.childProfiles)) {
    childProfiles = user.childProfiles as unknown as ChildProfileData[];
  }

  return {
    displayName: user?.displayName || null,
    totalReflections,
    firstReflectionDate: firstReflection?.createdAt || null,
    topEmotions: emotionGroups.map((g) => ({
      emotion: g.emotionalTone || 'neutral',
      count: g._count.id,
    })),
    recentTrend,
    lastRecommendedAction: lastWithAction?.recommendedAction || null,
    parentingType: (user as any)?.parentingType || null,
    childProfiles,
  };
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
    select: {
      id: true,
      content: true,
      emotionalTone: true,
      recommendedAction: true,
      createdAt: true,
      conversations: {
        orderBy: { timestamp: 'asc' as const },
        take: 2,
        select: { role: true, content: true },
      },
      _count: {
        select: { conversations: true },
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
 * 과거 회고를 요약 문자열로 변환 (강화된 버전)
 */
function summarizeReflection(reflection: ReflectionWithConversations): string {
  const date = reflection.createdAt;
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  const emotionLabel = reflection.emotionalTone
    ? EMOTION_TAGS_KR[reflection.emotionalTone as EmotionTag] || reflection.emotionalTone
    : '기타';

  // 사용자 내용 요약 (100자)
  const contentSummary = reflection.content.length > 100
    ? reflection.content.substring(0, 100) + '...'
    : reflection.content;

  // AI 첫 응답의 핵심 메시지 추출 (100자)
  let aiSummary = '';
  const aiResponse = reflection.conversations.find((c) => c.role === 'assistant');
  if (aiResponse) {
    // ==킬링 문장== 추출 우선
    const killingMatch = aiResponse.content.match(/==(.+?)==/);
    if (killingMatch) {
      aiSummary = killingMatch[1].substring(0, 100);
    } else {
      // 첫 문장 추출
      const firstSentence = aiResponse.content.split(/[.。!？\n]/)[0] || '';
      aiSummary = firstSentence.substring(0, 100);
    }
  }

  // 대화 턴 수
  const turnCount = reflection._count?.conversations || 0;
  const turnInfo = turnCount > 2 ? ` (${Math.floor(turnCount / 2)}회 대화)` : '';

  // 추천 액션
  const actionSummary = reflection.recommendedAction
    ? ` | 추천: ${reflection.recommendedAction.substring(0, 80)}`
    : '';

  let summary = `[${dateStr}] [${emotionLabel}]${turnInfo} "${contentSummary}"`;
  if (aiSummary) {
    summary += ` → ==${aiSummary}==`;
  }
  summary += actionSummary;

  return summary.length > MAX_SUMMARY_LENGTH
    ? summary.substring(0, MAX_SUMMARY_LENGTH) + '...'
    : summary;
}

/**
 * 사용자 프로필을 프롬프트 문자열로 변환
 */
function formatUserProfile(profile: UserProfileContext): string {
  const parts: string[] = [];

  if (profile.displayName) {
    parts.push(`이름: ${profile.displayName}`);
  }

  parts.push(`총 상담 횟수: ${profile.totalReflections}회`);

  if (profile.firstReflectionDate) {
    const firstDate = profile.firstReflectionDate;
    const daysSince = Math.floor(
      (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince > 0) {
      parts.push(`이용 기간: ${daysSince}일 (${firstDate.getMonth() + 1}/${firstDate.getDate()}부터)`);
    }
  }

  if (profile.topEmotions.length > 0) {
    const emotionStr = profile.topEmotions
      .map((e) => {
        const label = EMOTION_TAGS_KR[e.emotion as EmotionTag] || e.emotion;
        return `${label}(${e.count}회)`;
      })
      .join(', ');
    parts.push(`주요 감정: ${emotionStr}`);
  }

  const trendLabels = {
    improving: '최근 긍정적 감정 증가 추세',
    stable: '감정 상태 안정적',
    declining: '최근 부정적 감정 증가 추세',
    unknown: '',
  };
  if (trendLabels[profile.recentTrend]) {
    parts.push(`감정 추이: ${trendLabels[profile.recentTrend]}`);
  }

  if (profile.lastRecommendedAction) {
    parts.push(`최근 추천 액션: "${profile.lastRecommendedAction.substring(0, 100)}"`);
  }

  // 양육 환경
  const parentingLabels: Record<string, string> = {
    dual_income: '맞벌이',
    single_income: '외벌이',
    single_parent: '한부모',
    other: '기타',
  };
  if (profile.parentingType && parentingLabels[profile.parentingType]) {
    parts.push(`양육 환경: ${parentingLabels[profile.parentingType]}`);
  }

  // 아이 정보
  if (profile.childProfiles.length > 0) {
    const childStr = profile.childProfiles.map((child) => {
      const genderLabel = child.gender === 'boy' ? '남아' : child.gender === 'girl' ? '여아' : '';
      const [year, month] = child.birthDate.split('-').map(Number);
      const now = new Date();
      const totalMonths = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
      const ageStr = totalMonths < 12 ? `${totalMonths}개월` : `${Math.floor(totalMonths / 12)}세`;
      const namePart = child.name ? `${child.name}` : '';
      return [namePart, ageStr, genderLabel].filter(Boolean).join(' ');
    }).join(', ');
    parts.push(`아이: ${childStr}`);
  }

  return parts.join('\n');
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
  const [pastReflections, profile] = await Promise.all([
    retrievePastReflections(userId, currentContent, currentEmotion, excludeReflectionId),
    buildUserProfileContext(userId),
  ]);

  // 프로필도 없고 과거 회고도 없으면 undefined
  const hasProfile = profile && (profile.totalReflections > 0 || profile.childProfiles.length > 0 || profile.parentingType);
  if (!hasProfile && pastReflections.length === 0) return undefined;

  const sections: string[] = [];

  // 사용자 프로필 섹션
  if (hasProfile) {
    sections.push(`**사용자 프로필:**
${formatUserProfile(profile!)}`);
  }

  // 과거 상담 맥락 섹션
  if (pastReflections.length > 0) {
    const summaries = pastReflections.map(summarizeReflection);
    sections.push(`**이전 상담 기록:**
${summaries.map((s) => `- ${s}`).join('\n')}`);
  }

  // 라포 형성 지시
  sections.push(`**라포 형성 지시 (중요):**
- 이 사용자와 이전 상담을 나눈 적이 있습니다. 처음 만난 것처럼 대하지 마세요.
${profile?.displayName ? `- "${profile.displayName}"님이라고 자연스럽게 불러주세요.` : ''}
${profile && profile.totalReflections > 3 ? `- "벌써 ${profile.totalReflections}번째 이야기를 나누네요" 같은 연결감을 첫 문장에서 자연스럽게 표현하세요.` : ''}
${profile?.recentTrend === 'improving' ? '- 최근 감정이 좋아지고 있는 추세입니다. 이 변화를 자연스럽게 인정하고 격려하세요.' : ''}
${profile?.recentTrend === 'declining' ? '- 최근 힘든 시간을 보내고 있는 것 같습니다. 더 깊은 공감과 지지를 보여주세요.' : ''}
${profile?.lastRecommendedAction ? '- 지난 상담에서 추천한 액션이 있습니다. 첫 응답에서 "지난번 추천드린 것은 해보셨어요?" 같이 자연스럽게 한 번만 물어보세요. 강요하지 마세요.' : ''}
- 반복 패턴이 보이면 부드럽게 언급하고 ("지난번에도 비슷한 감정을 느꼈었죠..."), 이전 인사이트와 연결하세요.
- 과거를 들먹이며 비난하는 톤은 절대 금지입니다. 과거 맥락이 현재 상황과 관련 없으면 언급하지 마세요.
- 라포 관련 언급은 첫 응답에서 자연스럽게 1~2줄만. 과도하게 이전 상담을 들먹이면 부담스럽습니다.
${profile?.childProfiles && profile.childProfiles.length > 0 ? `- 아이 정보가 프로필에 포함되어 있습니다. 아이의 나이/발달 단계에 맞는 조언을 해주세요. 아이 이름이 있다면 자연스럽게 사용하세요.
- 아이의 연령대에 따라: 영유아(0~3세)는 애착 형성 중심, 미취학(4~6세)는 자율성/사회성 중심, 초등(7~12세)는 학업/또래관계 중심으로 공감하세요.` : ''}
${profile?.parentingType === 'single_parent' ? '- 한부모 가정입니다. 혼자 양육하는 어려움에 깊이 공감하고, "혼자서도 정말 잘하고 계세요"라는 메시지를 자연스럽게 전달하세요.' : ''}
${profile?.parentingType === 'dual_income' ? '- 맞벌이 가정입니다. 일과 육아 병행의 어려움을 이해하고 공감하세요.' : ''}`);

  return '\n\n' + sections.join('\n\n');
}
