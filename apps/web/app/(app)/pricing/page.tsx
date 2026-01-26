'use client';

import { useState } from 'react';
import { useTossPayments } from '@/lib/hooks/useTossPayments';

export default function PricingPage() {
  const { isLoaded, isProcessing, error, requestPayment } = useTossPayments();
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'family' | null>(null);

  const handleUpgrade = async (plan: 'premium' | 'family') => {
    setSelectedPlan(plan);
    try {
      await requestPayment(plan);
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">결제 오류</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">요금제 선택</h1>
        <p className="text-xl text-gray-600">
          당신에게 맞는 플랜을 선택하세요
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* 무료 플랜 */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:shadow-lg transition-shadow">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">무료</h3>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              ₩0
            </div>
            <div className="text-gray-500">/월</div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✅</span>
              <span className="text-gray-700">월 10회 AI 회고</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✅</span>
              <span className="text-gray-700">기본 감정 분석</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✅</span>
              <span className="text-gray-700">7일 히스토리 조회</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">✅</span>
              <span className="text-gray-700">음성 입력 (제한적)</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-3">❌</span>
              <span className="text-gray-400">마음 날씨 지수</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-3">❌</span>
              <span className="text-gray-400">데이터 내보내기</span>
            </li>
          </ul>

          <button
            disabled
            className="w-full bg-gray-200 text-gray-600 font-semibold py-4 rounded-xl cursor-not-allowed"
          >
            현재 플랜
          </button>
        </div>

        {/* 프리미엄 플랜 */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-4 border-green-500 p-8 relative hover:shadow-2xl transition-shadow">
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
            ⭐ 인기
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">프리미엄</h3>
            <div className="text-5xl font-bold text-green-600 mb-2">
              ₩9,900
            </div>
            <div className="text-gray-600">/월</div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">무제한 AI 회고</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">고급 마음 날씨 지수</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">30일 트렌드 분석</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">음성 입력 무제한</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">데이터 내보내기</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">광고 제거</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3 text-xl">✅</span>
              <span className="text-gray-800 font-medium">주간 리포트 이메일</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('premium')}
            disabled={!isLoaded || isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing && selectedPlan === 'premium' ? '처리 중...' : '업그레이드 →'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            7일 무료 체험 가능
          </p>
        </div>

        {/* 패밀리 플랜 */}
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-8 hover:shadow-lg transition-shadow">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">패밀리</h3>
            <div className="text-5xl font-bold text-purple-600 mb-2">
              ₩14,900
            </div>
            <div className="text-gray-500">/월</div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="text-purple-600 mr-3">✨</span>
              <span className="text-gray-700 font-medium">프리미엄 모든 기능</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-3">✨</span>
              <span className="text-gray-700 font-medium">2개 계정 (부부 공동)</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-3">✨</span>
              <span className="text-gray-700 font-medium">부부 동기화 대시보드</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-3">✨</span>
              <span className="text-gray-700 font-medium">가족 목표 추적</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-3">✨</span>
              <span className="text-gray-700 font-medium">우선 고객 지원</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('family')}
            disabled={!isLoaded || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing && selectedPlan === 'family' ? '처리 중...' : '업그레이드 →'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            14일 무료 체험 가능
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          자주 묻는 질문
        </h2>

        <div className="space-y-6">
          <details className="bg-white rounded-xl p-6 border border-gray-200">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              무료 플랜에서 프리미엄으로 업그레이드하면 어떤 점이 좋나요?
            </summary>
            <p className="mt-4 text-gray-600">
              무제한 AI 회고로 언제든지 감정을 털어놓을 수 있고, 마음 날씨 지수로 장기적인 패턴을 파악할 수 있습니다.
              또한 30일 트렌드 분석으로 번아웃을 조기에 감지할 수 있습니다.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 border border-gray-200">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              언제든지 취소할 수 있나요?
            </summary>
            <p className="mt-4 text-gray-600">
              네, 언제든지 취소 가능합니다. 취소 후에도 결제 주기 종료일까지는 프리미엄 기능을 사용할 수 있습니다.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 border border-gray-200">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              결제 수단은 무엇이 있나요?
            </summary>
            <p className="mt-4 text-gray-600">
              신용카드, 카카오페이, 네이버페이를 지원합니다. (곧 추가 예정)
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 border border-gray-200">
            <summary className="font-semibold text-gray-900 cursor-pointer">
              패밀리 플랜은 어떻게 작동하나요?
            </summary>
            <p className="mt-4 text-gray-600">
              부부가 각각 독립적인 계정을 사용하면서, 선택적으로 감정 상태를 공유할 수 있습니다.
              서로의 번아웃 위험도를 파악하고 지원할 수 있습니다.
            </p>
          </details>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">
          7일 무료 체험으로 시작하세요
        </h2>
        <p className="text-lg mb-8 opacity-90">
          카드 정보 없이 프리미엄 기능을 먼저 경험해보세요
        </p>
        <button
          onClick={() => handleUpgrade('premium')}
          disabled={!isLoaded || isProcessing}
          className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '처리 중...' : '무료로 시작하기 →'}
        </button>
      </div>
    </div>
  );
}
