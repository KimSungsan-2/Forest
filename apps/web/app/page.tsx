import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* 로고 및 제목 */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-green-800">
            🌲 어른의 숲
          </h1>
          <p className="text-2xl text-gray-700">
            Forest of Calm
          </p>
        </div>

        {/* 한 줄 컨셉 */}
        <p className="text-xl text-gray-600 font-medium">
          부모의 자책감을 성장의 데이터로 바꾸는 AI 감정 회고 플랫폼
        </p>

        {/* 핵심 기능 소개 */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">AI 가이디드 벤팅</h3>
            <p className="text-gray-600 text-sm">
              오늘 하루 힘들었던 일을 AI에게 털어놓으세요.
              판단이 아닌 인지 재구조화로 응답합니다.
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
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-lg font-semibold mb-2">음성 입력</h3>
            <p className="text-gray-600 text-sm">
              피곤할 때는 타이핑 대신
              목소리로 감정을 표현하세요.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">회고 히스토리</h3>
            <p className="text-gray-600 text-sm">
              과거의 감정 여정을 돌아보며
              성장의 흔적을 확인하세요.
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            href="/vent"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg shadow-lg"
          >
            게스트로 시작하기 →
          </Link>
          <Link
            href="/signup"
            className="bg-white hover:bg-gray-50 text-green-600 font-semibold py-4 px-8 rounded-lg border-2 border-green-600 transition-colors text-lg"
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

        {/* 프라이버시 강조 */}
        <p className="text-sm text-gray-500 mt-8">
          🔒 당신의 감정은 안전하게 보호됩니다. GDPR 준수 및 엔드투엔드 암호화
        </p>
      </div>
    </div>
  );
}
