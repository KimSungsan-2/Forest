'use client';

import Link from 'next/link';
import { useTimeTheme } from '@/lib/hooks/useTimeTheme';

const TIME_GRADIENTS = {
  morning: 'bg-gradient-to-b from-amber-50 via-orange-50/50 to-blue-50',
  afternoon: 'bg-gradient-to-b from-green-50 to-blue-50',
  evening: 'bg-gradient-to-b from-indigo-50 via-purple-50/50 to-slate-50',
};

const TIME_TITLE_COLORS = {
  morning: 'text-amber-800',
  afternoon: 'text-green-800',
  evening: 'text-indigo-800',
};

const TIME_BTN_COLORS = {
  morning: 'bg-amber-600 hover:bg-amber-700',
  afternoon: 'bg-green-600 hover:bg-green-700',
  evening: 'bg-indigo-600 hover:bg-indigo-700',
};

const TIME_BTN_OUTLINE = {
  morning: 'text-amber-600 border-amber-600',
  afternoon: 'text-green-600 border-green-600',
  evening: 'text-indigo-600 border-indigo-600',
};

export default function HomePage() {
  const theme = useTimeTheme();
  const t = theme.timeOfDay;

  return (
    <div className={`min-h-screen ${TIME_GRADIENTS[t]} flex flex-col items-center justify-center p-4 transition-colors duration-1000`}>
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* 로고 및 제목 */}
        <div className="space-y-4">
          <h1 className={`text-6xl font-bold ${TIME_TITLE_COLORS[t]} transition-colors duration-1000`}>
            {theme.icon} 어른의 숲
          </h1>
          <p className="text-2xl text-gray-700">
            Forest of Calm
          </p>
        </div>

        {/* 시간대별 인사 */}
        <p className="text-xl text-gray-600 font-medium">
          {theme.greeting} — 오늘의 감정을 기록하는 AI 육아 동반자
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/vent"
            className={`${TIME_BTN_COLORS[t]} text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg shadow-lg`}
          >
            오늘의 기록 시작하기 →
          </Link>
          <Link
            href="/signup"
            className={`bg-white hover:bg-gray-50 ${TIME_BTN_OUTLINE[t]} font-semibold py-4 px-8 rounded-lg border-2 transition-colors text-lg`}
          >
            회원가입
          </Link>
          <Link
            href="/login"
            className="bg-white hover:bg-gray-50 text-gray-600 font-semibold py-4 px-8 rounded-lg border-2 border-gray-300 transition-colors text-lg"
          >
            로그인
          </Link>
        </div>

        {/* 핵심 기능 소개 */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">AI 감정 기록</h3>
            <p className="text-gray-600 text-sm">
              뿌듯했던 순간도, 힘들었던 순간도 AI와 함께 기록하세요.
              판단 없이 공감하고 함께 성장합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">☁️</div>
            <h3 className="text-lg font-semibold mb-2">마음 날씨 지수</h3>
            <p className="text-gray-600 text-sm">
              당신의 감정 패턴을 분석하여
              번아웃 위험을 미리 감지합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">성장 히스토리</h3>
            <p className="text-gray-600 text-sm">
              기쁨과 고민의 감정 여정을 돌아보며
              부모로서의 성장을 확인하세요.
            </p>
          </div>
        </div>

        {/* 프라이버시 강조 */}
        <p className="text-sm text-gray-500 mt-8">
          🔒 당신의 감정은 안전하게 보호됩니다. GDPR 준수 및 엔드투엔드 암호화
        </p>
      </div>
    </div>
  );
}
