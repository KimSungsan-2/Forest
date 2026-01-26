'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reflectionApi } from '@/lib/api/reflections';
import type { Reflection, EmotionTag } from '../../../../../shared/types/reflection';

const EMOTION_FILTERS: { value: EmotionTag | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: '전체', emoji: '📝' },
  { value: 'guilt', label: '죄책감', emoji: '😔' },
  { value: 'anger', label: '분노', emoji: '😤' },
  { value: 'exhaustion', label: '피로', emoji: '😫' },
  { value: 'anxiety', label: '불안', emoji: '😰' },
  { value: 'sadness', label: '슬픔', emoji: '😢' },
  { value: 'frustration', label: '좌절', emoji: '😣' },
];

export default function HistoryPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTag | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadReflections();
  }, [selectedEmotion, page]);

  const loadReflections = async () => {
    setLoading(true);
    try {
      const data = await reflectionApi.list({
        page,
        limit: 10,
        emotionTag: selectedEmotion !== 'all' ? selectedEmotion : undefined,
      });
      setReflections(data.reflections);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadReflections();
      return;
    }

    setLoading(true);
    try {
      const data = await reflectionApi.list({
        search: searchQuery,
        limit: 10,
      });
      setReflections(data.reflections);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      neutral: '😐',
    };
    return emojiMap[emotion || 'neutral'] || '💭';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">회고 히스토리</h1>
        <p className="text-gray-600">과거의 감정 여정을 돌아보세요</p>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="회고 내용 검색..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* 감정 필터 */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {EMOTION_FILTERS.map((emotion) => (
            <button
              key={emotion.value}
              onClick={() => {
                setSelectedEmotion(emotion.value);
                setPage(1);
              }}
              className={`${
                selectedEmotion === emotion.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } px-4 py-2 rounded-lg border border-gray-200 transition-colors whitespace-nowrap font-medium text-sm`}
            >
              {emotion.emoji} {emotion.label}
            </button>
          ))}
        </div>
      </div>

      {/* 회고 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      ) : reflections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600 mb-4">
            {searchQuery ? '검색 결과가 없습니다' : '아직 작성한 회고가 없습니다'}
          </p>
          <Link
            href="/vent"
            className="inline-block text-green-600 hover:text-green-700 font-medium"
          >
            첫 회고 작성하기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <Link
                key={reflection.id}
                href={`/reflection/${reflection.id}`}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-3xl">
                        {getEmotionEmoji(reflection.emotionalTone)}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {reflection.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(reflection.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 line-clamp-3 mb-3">
                      {reflection.content}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      {reflection.sentimentScore !== null && (
                        <span className="text-gray-600">
                          감정 점수:{' '}
                          <span
                            className={
                              reflection.sentimentScore > 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {reflection.sentimentScore.toFixed(2)}
                          </span>
                        </span>
                      )}
                      {reflection.conversationCount && (
                        <span className="text-gray-600">
                          💬 {reflection.conversationCount}개 대화
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ← 이전
              </button>
              <span className="px-4 py-2 text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
