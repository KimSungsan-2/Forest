'use client';

import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  benefits?: string[];
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = '프리미엄으로 업그레이드',
  message = '이 기능은 프리미엄 플랜에서 사용할 수 있습니다',
  benefits = [
    '✅ 무제한 AI 회고',
    '✅ 고급 마음 날씨 지수',
    '✅ 30일 트렌드 분석',
    '✅ 데이터 내보내기',
    '✅ 광고 제거',
  ],
}: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push('/pricing');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-fade-in">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* 아이콘 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* 혜택 목록 */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">프리미엄 혜택</h3>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-gray-700">
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* 가격 */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-green-600">₩9,900</div>
          <div className="text-sm text-gray-500">/월</div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
          >
            나중에
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            업그레이드 →
          </button>
        </div>
      </div>
    </div>
  );
}
