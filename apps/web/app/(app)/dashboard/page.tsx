'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reflectionApi } from '@/lib/api/reflections';
import type { Reflection } from '../../../../../shared/types/reflection';

export default function DashboardPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReflections: 0,
    thisWeek: 0,
    avgSentiment: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await reflectionApi.list({ limit: 5 });
      setReflections(data.reflections);

      // 통계 계산
      const totalReflections = data.total;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeek = data.reflections.filter(
        (r) => new Date(r.createdAt) > weekAgo
      ).length;
      const avgSentiment =
        data.reflections.reduce((sum, r) => sum + (r.sentimentScore || 0), 0) /
        (data.reflections.length || 1);

      setStats({
        totalReflections,
        thisWeek,
        avgSentiment,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEmotionEmoji = (emotion: string | null) => {
    const emojiMap: Record<string, string> = {
      guilt: '😔',
      anger: '😤',
      exhaustion: '😫',
      anxiety: '😰',
      sadness: '😢',
      frustration: '😣',
      overwhelm: '😵',
      loneliness: '😞',
      pride: '😊',
      joy: '😁',
      gratitude: '🥰',
      happiness: '☀️',
      neutral: '😐',
    };
    return emojiMap[emotion || 'neutral'] || '💭';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 환영 메시지 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">오늘 하루는 어떠셨나요?</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">전체 회고</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.totalReflections}
          </div>
          <div className="text-xs text-gray-500 mt-1">개</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">이번 주</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.thisWeek}
          </div>
          <div className="text-xs text-gray-500 mt-1">개 작성</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">평균 감정 점수</div>
          <div className="text-3xl font-bold text-purple-600">
            {stats.avgSentiment.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">-1.0 ~ 1.0</div>
        </div>
      </div>

      {/* 빠른 액션 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* 상담 카드 */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="text-3xl mb-3">🌲</div>
          <h2 className="text-xl font-bold mb-2">오늘의 감정 기록</h2>
          <p className="text-sm opacity-90 mb-4">
            힘들었던 순간도, 뿌듯했던 순간도 함께 나눠요
          </p>
          <Link
            href="/vent"
            className="inline-block bg-white text-green-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            기록하기 →
          </Link>
        </div>

        {/* 감사 일기 카드 */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-6 text-white">
          <div className="text-3xl mb-3">🌻</div>
          <h2 className="text-xl font-bold mb-2">오늘의 감사</h2>
          <p className="text-sm opacity-90 mb-4">
            작은 것이라도 좋아요. 감사한 순간을 기록해보세요
          </p>
          <Link
            href="/gratitude"
            className="inline-block bg-white text-amber-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            감사 쓰기 →
          </Link>
        </div>
      </div>

      {/* 최근 회고 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">최근 회고</h2>
          <Link
            href="/history"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            전체 보기 →
          </Link>
        </div>

        {reflections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-600 mb-4">아직 작성한 회고가 없습니다</p>
            <Link
              href="/vent"
              className="inline-block text-green-600 hover:text-green-700 font-medium"
            >
              첫 회고 작성하기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <Link
                key={reflection.id}
                href={`/reflection/${reflection.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">
                        {getEmotionEmoji(reflection.emotionalTone)}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {reflection.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {reflection.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{formatDate(reflection.createdAt)}</span>
                      {reflection.conversationCount && (
                        <span>💬 {reflection.conversationCount}개 대화</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
