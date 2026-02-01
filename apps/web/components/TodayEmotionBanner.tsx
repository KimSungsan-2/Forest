'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, type TodayEmotionStats } from '@/lib/api/analytics';

const EMOTION_LABELS: Record<string, { label: string; emoji: string }> = {
  guilt: { label: '죄책감', emoji: '😔' },
  anger: { label: '분노', emoji: '😤' },
  exhaustion: { label: '피로', emoji: '😫' },
  anxiety: { label: '불안', emoji: '😰' },
  sadness: { label: '슬픔', emoji: '😢' },
  frustration: { label: '좌절', emoji: '😣' },
  overwhelm: { label: '압도됨', emoji: '😵' },
  loneliness: { label: '외로움', emoji: '😞' },
  pride: { label: '뿌듯함', emoji: '😊' },
  joy: { label: '기쁨', emoji: '😁' },
  gratitude: { label: '감사', emoji: '🥰' },
  happiness: { label: '행복', emoji: '☀️' },
};

export default function TodayEmotionBanner() {
  const [stats, setStats] = useState<TodayEmotionStats | null>(null);

  useEffect(() => {
    analyticsApi.getTodayEmotions().then(setStats).catch(() => {});
  }, []);

  if (!stats || stats.totalToday < 2) return null;

  const top = stats.emotions[0];
  if (!top) return null;

  const topInfo = EMOTION_LABELS[top.emotion] || { label: top.emotion, emoji: '💬' };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 px-4 py-3 text-center shadow-sm">
      <p className="text-sm text-gray-600">
        오늘 어른의 숲 부모님 중{' '}
        <span className="font-bold text-gray-900">{top.percentage}%</span>가{' '}
        <span className="font-semibold">
          {topInfo.emoji} {topInfo.label}
        </span>
        을 느꼈어요
      </p>
      {stats.emotions.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
          {stats.emotions.slice(0, 4).map((e) => {
            const info = EMOTION_LABELS[e.emotion] || { label: e.emotion, emoji: '💬' };
            return (
              <span
                key={e.emotion}
                className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full"
              >
                {info.emoji} {info.label} {e.percentage}%
              </span>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-1.5">
        오늘 {stats.totalToday}명의 부모님이 기록했어요 — 당신은 혼자가 아니에요
      </p>
    </div>
  );
}
