'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export default function UsageBanner() {
  const router = useRouter();
  const [usage, setUsage] = useState<{
    subscriptionTier: string;
    isUnlimited: boolean;
    currentUsage: number | null;
    limit: number | null;
    remaining: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      if (!authApi.isAuthenticated()) {
        setLoading(false);
        return;
      }

      const data = await authApi.getUsage();
      setUsage(data);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 데이터 없음
  if (loading || !usage) return null;

  // 프리미엄 사용자는 배너 표시 안 함
  if (usage.isUnlimited || usage.subscriptionTier !== 'free') return null;

  // 무료 사용자
  const percentage = usage.limit ? (usage.currentUsage! / usage.limit) * 100 : 0;
  const isWarning = percentage >= 70; // 70% 이상 사용 시 경고
  const isLimit = percentage >= 100; // 한도 도달

  return (
    <div
      className={`sticky top-0 z-40 ${
        isLimit
          ? 'bg-gradient-to-r from-red-500 to-pink-500'
          : isWarning
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
      } text-white px-4 py-3 shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {isLimit ? '⚠️' : isWarning ? '⏰' : '💫'}
            </span>
            <div>
              <div className="font-semibold">
                {isLimit
                  ? '월 사용 한도를 모두 사용했습니다'
                  : `이번 달 ${usage.remaining}회 남음`}
              </div>
              <div className="text-sm opacity-90">
                무료 플랜: {usage.currentUsage}/{usage.limit}회 사용 중
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mt-2 w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => router.push('/pricing')}
          className="ml-4 bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          {isLimit ? '지금 업그레이드' : '프리미엄 보기'}
        </button>
      </div>
    </div>
  );
}
