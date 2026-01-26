'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import UsageBanner from '@/components/UsageBanner';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 게스트 모드: 인증 체크 우회
        if (!authApi.isAuthenticated()) {
          // 로그인하지 않아도 게스트로 사용 가능
          setUser({ email: 'guest', displayName: '게스트' });
          setLoading(false);
          return;
        }

        // 로그인된 경우에만 사용자 정보 조회 시도
        try {
          const { user } = await authApi.getMe();
          setUser(user);
        } catch (error) {
          // API 에러 시에도 게스트로 사용 가능
          setUser({ email: 'guest', displayName: '게스트' });
        }
      } catch (error) {
        setUser({ email: 'guest', displayName: '게스트' });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌲</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🌲</span>
              <span className="text-xl font-bold text-green-800">어른의 숲</span>
            </Link>

            {/* 네비게이션 */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  pathname === '/dashboard'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                } pb-1 transition-colors`}
              >
                대시보드
              </Link>
              <Link
                href="/vent"
                className={`${
                  pathname === '/vent'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                } pb-1 transition-colors`}
              >
                감정 털어놓기
              </Link>
              <Link
                href="/history"
                className={`${
                  pathname === '/history'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                } pb-1 transition-colors`}
              >
                히스토리
              </Link>
              <Link
                href="/mind-weather"
                className={`${
                  pathname === '/mind-weather'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                } pb-1 transition-colors`}
              >
                마음 날씨
              </Link>
            </nav>

            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.displayName || user?.email}
              </span>
              {user?.email === 'guest' ? (
                <Link
                  href="/login"
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  로그인
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  로그아웃
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 네비게이션 */}
      <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex space-x-4 overflow-x-auto">
        <Link
          href="/dashboard"
          className={`${
            pathname === '/dashboard'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          } px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap`}
        >
          대시보드
        </Link>
        <Link
          href="/vent"
          className={`${
            pathname === '/vent'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          } px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap`}
        >
          감정 털어놓기
        </Link>
        <Link
          href="/history"
          className={`${
            pathname === '/history'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          } px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap`}
        >
          히스토리
        </Link>
        <Link
          href="/mind-weather"
          className={`${
            pathname === '/mind-weather'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          } px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap`}
        >
          마음 날씨
        </Link>
      </nav>

      {/* 사용량 배너 */}
      <UsageBanner />

      {/* 메인 콘텐츠 */}
      <main>{children}</main>
    </div>
  );
}
