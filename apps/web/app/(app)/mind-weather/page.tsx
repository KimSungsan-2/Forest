'use client';

import { useState, useEffect } from 'react';
import { analyticsApi, MindWeatherScore } from '@/lib/api/analytics';
import { authApi } from '@/lib/api/auth';

const BURNOUT_RISK_CONFIG = {
  low: { label: '낮음', emoji: '✅', color: 'text-green-600', bg: 'bg-green-50' },
  medium: { label: '보통', emoji: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  high: { label: '높음', emoji: '🔴', color: 'text-orange-600', bg: 'bg-orange-50' },
  critical: { label: '매우 높음', emoji: '🚨', color: 'text-red-600', bg: 'bg-red-50' },
};

const TREND_CONFIG = {
  improving: { label: '개선 중', emoji: '📈', color: 'text-green-600' },
  stable: { label: '안정적', emoji: '➡️', color: 'text-blue-600' },
  declining: { label: '악화 중', emoji: '📉', color: 'text-red-600' },
};

export default function MindWeatherPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<MindWeatherScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 인증 확인
      if (!authApi.isAuthenticated()) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      // 마음 날씨 데이터 조회
      try {
        const data = await analyticsApi.getLatest();
        setWeatherData(data);
      } catch (err: any) {
        // 404: 아직 계산되지 않음
        if (err.response?.status === 404) {
          setWeatherData(null);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Failed to load mind weather:', err);
      setError(err.message || '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);

      const data = await analyticsApi.calculate();
      setWeatherData(data);
    } catch (err: any) {
      console.error('Failed to calculate mind weather:', err);
      setError(err.response?.data?.error || '계산에 실패했습니다');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">☁️</div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마음 날씨 지수</h1>
          <p className="text-gray-600">당신의 감정 트렌드와 번아웃 위험도를 확인하세요</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">회원 전용 기능</h2>
          <p className="text-gray-700 mb-6">
            마음 날씨 지수는 회원가입 후 이용할 수 있습니다.
            <br />
            회원가입하고 감정 데이터를 축적하면 자동으로 분석됩니다.
          </p>
          <a
            href="/signup"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            회원가입하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마음 날씨 지수</h1>
          <p className="text-gray-600">당신의 감정 트렌드와 번아웃 위험도</p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {calculating ? '계산 중...' : weatherData ? '다시 계산' : '지수 계산하기'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!weatherData && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">아직 분석 데이터가 없습니다</h2>
          <p className="text-gray-700 mb-6">
            "지수 계산하기" 버튼을 눌러 마음 날씨 지수를 생성하세요.
            <br />
            최소 3개 이상의 회고가 있어야 정확한 분석이 가능합니다.
          </p>
        </div>
      )}

      {weatherData && (
        <div className="space-y-6">
          {/* 주요 지표 */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* 전체 점수 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">전체 마음 점수</h3>
              <div className="flex items-center justify-center">
                <div className="text-5xl font-bold text-blue-600">
                  {Math.round(weatherData.overallScore)}
                </div>
                <span className="text-2xl text-gray-500 ml-2">/100</span>
              </div>
              <div className="mt-4 text-center">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      weatherData.overallScore >= 70
                        ? 'bg-green-500'
                        : weatherData.overallScore >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${weatherData.overallScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 번아웃 위험도 */}
            <div
              className={`rounded-xl p-6 border ${
                BURNOUT_RISK_CONFIG[weatherData.burnoutRisk].bg
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">번아웃 위험도</h3>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl">
                  {BURNOUT_RISK_CONFIG[weatherData.burnoutRisk].emoji}
                </span>
                <span
                  className={`text-3xl font-bold ${
                    BURNOUT_RISK_CONFIG[weatherData.burnoutRisk].color
                  }`}
                >
                  {BURNOUT_RISK_CONFIG[weatherData.burnoutRisk].label}
                </span>
              </div>
            </div>

            {/* 트렌드 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">트렌드</h3>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl">
                  {TREND_CONFIG[weatherData.trendDirection].emoji}
                </span>
                <span
                  className={`text-3xl font-bold ${
                    TREND_CONFIG[weatherData.trendDirection].color
                  }`}
                >
                  {TREND_CONFIG[weatherData.trendDirection].label}
                </span>
              </div>
            </div>
          </div>

          {/* 추천사항 */}
          {weatherData.recommendations.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 맞춤 추천사항</h3>
              <div className="space-y-3">
                {weatherData.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                    <span className="text-green-600 font-semibold">{index + 1}.</span>
                    <p className="text-gray-700 flex-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 반복 테마 */}
          {Object.keys(weatherData.repetitiveThemes).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🔁 반복되는 감정 테마
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(weatherData.repetitiveThemes)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([theme, count]) => (
                    <div key={theme} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">{theme}</span>
                      <span className="text-xl font-bold text-gray-900">{count}회</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 자주 사용한 단어 */}
          {Object.keys(weatherData.wordFrequency).length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                💬 자주 사용한 단어
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(weatherData.wordFrequency)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([word, count]) => (
                    <span
                      key={word}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {word} ({count})
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* 상세 지표 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📈 상세 지표</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">부정성 비율</span>
                <span className="text-xl font-bold text-gray-900">
                  {(weatherData.negativityRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">최근 7일 회고 수</span>
                <span className="text-xl font-bold text-gray-900">
                  {weatherData.reflectionFrequency}회
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
