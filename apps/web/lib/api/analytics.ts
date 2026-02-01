import { apiRequest } from './client';

export interface MindWeatherScore {
  overallScore: number;
  burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
  negativityRate: number;
  sentimentAverage: number;
  diversityScore: number;
  reflectionFrequency: number;
  repetitiveThemes: { [theme: string]: number };
  wordFrequency: { [word: string]: number };
  recommendations: string[];
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface TrendData {
  date: Date;
  overallScore: number;
  burnoutRisk: string;
  trendDirection: string;
}

export interface TodayEmotionStats {
  totalToday: number;
  emotions: { emotion: string; count: number; percentage: number }[];
}

export const analyticsApi = {
  /**
   * 오늘의 감정 통계 (공개)
   */
  async getTodayEmotions(): Promise<TodayEmotionStats> {
    return apiRequest('/api/analytics/today-emotions');
  },

  /**
   * 마음 날씨 지수 계산
   */
  async calculate(): Promise<MindWeatherScore> {
    return apiRequest('/api/analytics/calculate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * 최신 마음 날씨 지수 조회
   */
  async getLatest(): Promise<MindWeatherScore> {
    return apiRequest('/api/analytics/mind-weather');
  },

  /**
   * 트렌드 데이터 조회
   */
  async getTrends(days: number = 30): Promise<{ trend: TrendData[]; period: { days: number } }> {
    return apiRequest(`/api/analytics/trends?days=${days}`);
  },
};
