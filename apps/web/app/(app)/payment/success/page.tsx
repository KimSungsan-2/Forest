'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTossPayments } from '@/lib/hooks/useTossPayments';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmPayment, isProcessing } = useTossPayments();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제를 처리하고 있습니다...');

  useEffect(() => {
    const processPayment = async () => {
      // URL에서 파라미터 추출
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setMessage('결제 정보가 올바르지 않습니다');
        return;
      }

      try {
        // 결제 승인 요청
        await confirmPayment(paymentKey, orderId, parseInt(amount));

        setStatus('success');
        setMessage('결제가 완료되었습니다!');

        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || '결제 승인에 실패했습니다');
      }
    };

    processPayment();
  }, [searchParams, confirmPayment, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* 아이콘 */}
          <div className="mb-6">
            {status === 'processing' && (
              <div className="text-6xl animate-spin">⏳</div>
            )}
            {status === 'success' && (
              <div className="text-6xl animate-bounce">✅</div>
            )}
            {status === 'error' && <div className="text-6xl">❌</div>}
          </div>

          {/* 상태 메시지 */}
          <h1
            className={`text-2xl font-bold mb-4 ${
              status === 'success'
                ? 'text-green-600'
                : status === 'error'
                ? 'text-red-600'
                : 'text-gray-900'
            }`}
          >
            {status === 'processing' && '결제 처리 중'}
            {status === 'success' && '결제 완료!'}
            {status === 'error' && '결제 실패'}
          </h1>

          <p className="text-gray-600 mb-8">{message}</p>

          {/* 로딩 스피너 */}
          {status === 'processing' && (
            <div className="flex justify-center">
              <div className="animate-pulse bg-gray-200 rounded-full h-2 w-32"></div>
            </div>
          )}

          {/* 성공 시 추가 정보 */}
          {status === 'success' && (
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800">
                프리미엄 기능이 활성화되었습니다
              </p>
              <p className="text-xs text-green-600 mt-2">
                잠시 후 대시보드로 이동합니다...
              </p>
            </div>
          )}

          {/* 에러 시 버튼 */}
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                요금제 페이지로 돌아가기
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                대시보드로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
