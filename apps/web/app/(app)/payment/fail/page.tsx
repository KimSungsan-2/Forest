'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('결제가 취소되었습니다');

  useEffect(() => {
    const recordFailure = async () => {
      const code = searchParams.get('code');
      const message = searchParams.get('message');
      const orderId = searchParams.get('orderId');

      if (message) {
        setErrorMessage(message);
      }

      // 실패 기록
      if (orderId) {
        try {
          await paymentsApi.failPayment({
            orderId,
            code: code || undefined,
            message: message || '사용자가 결제를 취소했습니다',
          });
        } catch (error) {
          console.error('Failed to record payment failure:', error);
        }
      }
    };

    recordFailure();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* 아이콘 */}
          <div className="text-6xl mb-6">😢</div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-red-600 mb-4">결제 실패</h1>

          {/* 에러 메시지 */}
          <p className="text-gray-600 mb-2">{errorMessage}</p>
          <p className="text-sm text-gray-500 mb-8">
            다시 시도하거나 다른 결제 수단을 이용해 주세요
          </p>

          {/* 일반적인 실패 사유 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              일반적인 결제 실패 사유:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 카드 한도 초과</li>
              <li>• 카드 정보 오류</li>
              <li>• 결제 시간 초과</li>
              <li>• 사용자 취소</li>
              <li>• 은행 시스템 오류</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>

          {/* 고객센터 링크 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              문제가 계속되면{' '}
              <a
                href="mailto:support@forestofcalm.com"
                className="text-blue-600 hover:underline"
              >
                고객센터
              </a>
              로 문의해 주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
