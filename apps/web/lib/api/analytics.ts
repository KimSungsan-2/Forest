import { apiClient } from './client';

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

export const analyticsApi = {
  /**
   * 마음 날씨 지수 계산
   */
  async calculate(): Promise<MindWeatherScore> {
    const response = await apiClient.post('/analytics/calculate');
    return response.data;
  },

  /**
   * 최신 마음 날씨 지수 조회
   */
  async getLatest(): Promise<MindWeatherScore> {
    const response = await apiClient.get('/analytics/mind-weather');
    return response.data;
  },

  /**
   * 트렌드 데이터 조회
   */
  async getTrends(days: number = 30): Promise<{ trend: TrendData[]; period: { days: number } }> {
    const response = await apiClient.get(`/analytics/trends?days=${days}`);
    return response.data;
  },
};
