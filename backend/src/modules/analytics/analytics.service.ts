import { prisma } from '../../config/database';
import { calculateMindWeather, MindWeatherScore } from './engines/weatherCalculator';

export class AnalyticsService {
  /**
   * 사용자의 최신 마음 날씨 지수 계산 및 저장
   */
  async calculateAndSaveMindWeather(userId: string): Promise<MindWeatherScore> {
    // 최근 30일 회고 데이터 가져오기
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        content: true,
        createdAt: true,
        sentimentScore: true,
      },
    });

    // 이전 점수 가져오기
    const previousScoreRecord = await prisma.mindWeatherScore.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const previousScore = previousScoreRecord
      ? {
          overallScore: previousScoreRecord.overallScore,
          burnoutRisk: previousScoreRecord.burnoutRisk as any,
          negativityRate: previousScoreRecord.negativityRate,
          sentimentAverage: 0,
          diversityScore: 0,
          reflectionFrequency: 0,
          repetitiveThemes: previousScoreRecord.repetitiveThemes as any,
          wordFrequency: previousScoreRecord.wordFrequency as any,
          recommendations: previousScoreRecord.recommendations as any,
          trendDirection: previousScoreRecord.trendDirection as any,
        }
      : undefined;

    // 마음 날씨 계산
    const weatherScore = calculateMindWeather(reflections, previousScore);

    // 데이터베이스에 저장
    await prisma.mindWeatherScore.create({
      data: {
        userId,
        date: new Date(),
        overallScore: weatherScore.overallScore,
        burnoutRisk: weatherScore.burnoutRisk,
        negativityRate: weatherScore.negativityRate,
        repetitiveThemes: weatherScore.repetitiveThemes,
        wordFrequency: weatherScore.wordFrequency,
        recommendations: weatherScore.recommendations,
        trendDirection: weatherScore.trendDirection,
      },
    });

    return weatherScore;
  }

  /**
   * 사용자의 최신 마음 날씨 지수 조회
   */
  async getLatestMindWeather(userId: string): Promise<MindWeatherScore | null> {
    const latest = await prisma.mindWeatherScore.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return {
      overallScore: latest.overallScore,
      burnoutRisk: latest.burnoutRisk as any,
      negativityRate: latest.negativityRate,
      sentimentAverage: 0, // 계산된 값이 아님
      diversityScore: 0, // 계산된 값이 아님
      reflectionFrequency: 0, // 계산된 값이 아님
      repetitiveThemes: latest.repetitiveThemes as any,
      wordFrequency: latest.wordFrequency as any,
      recommendations: latest.recommendations as string[],
      trendDirection: latest.trendDirection as any,
    };
  }

  /**
   * 사용자의 마음 날씨 트렌드 조회 (최근 N개)
   */
  async getMindWeatherTrend(
    userId: string,
    limit: number = 30
  ): Promise<
    Array<{
      date: Date;
      overallScore: number;
      burnoutRisk: string;
      trendDirection: string;
    }>
  > {
    const scores = await prisma.mindWeatherScore.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        date: true,
        overallScore: true,
        burnoutRisk: true,
        trendDirection: true,
      },
    });

    return scores.reverse(); // 오래된 순으로 정렬
  }

  /**
   * 게스트 사용자를 위한 임시 마음 날씨 계산
   * (데이터베이스에 저장하지 않음)
   */
  async calculateGuestMindWeather(
    reflections: Array<{ content: string; createdAt: Date }>
  ): Promise<MindWeatherScore> {
    return calculateMindWeather(reflections);
  }
}

export const analyticsService = new AnalyticsService();
