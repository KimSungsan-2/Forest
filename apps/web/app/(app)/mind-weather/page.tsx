'use client';

export default function MindWeatherPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">마음 날씨 지수</h1>
        <p className="text-gray-600">당신의 감정 트렌드와 번아웃 위험도를 확인하세요</p>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 text-center">
        <div className="text-6xl mb-6">☁️</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
          마음 날씨 지수는 당신의 회고 데이터를 분석하여
          <br />
          감정 패턴, 번아웃 위험도, 그리고 개인화된 추천사항을 제공합니다.
        </p>

        {/* 미리보기 기능 */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">감정 트렌드</h3>
            <p className="text-sm text-gray-600">
              주간/월간 감정 변화를 차트로 시각화
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="font-semibold text-gray-900 mb-2">번아웃 감지</h3>
            <p className="text-sm text-gray-600">
              AI 기반 번아웃 위험도 조기 경고
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">💡</div>
            <h3 className="font-semibold text-gray-900 mb-2">맞춤 추천</h3>
            <p className="text-sm text-gray-600">
              당신의 상태에 맞는 실천 가능한 조언
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          이 기능은 Phase 5에서 구현될 예정입니다
        </p>
      </div>

      {/* 임시 데이터 표시 (데모용) */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          예상 기능 미리보기
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">전체 마음 점수</span>
            <span className="text-2xl font-bold text-green-600">72/100</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">번아웃 위험도</span>
            <span className="text-xl font-semibold text-yellow-600">보통</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">트렌드</span>
            <span className="text-xl font-semibold text-blue-600">개선 중 📈</span>
          </div>
        </div>
      </div>
    </div>
  );
}
