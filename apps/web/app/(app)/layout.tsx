'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import UsageBanner from '@/components/UsageBanner';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import { useTimeTheme } from '@/lib/hooks/useTimeTheme';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const theme = useTimeTheme();

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

  const navLinks = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/vent', label: '오늘의 기록' },
    { href: '/history', label: '히스토리' },
    { href: '/mind-weather', label: '마음 날씨' },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bgGradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-4">{theme.icon}</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bgGradient} transition-colors duration-1000`}>
      {/* 헤더 */}
      <header className={`${theme.headerBg} border-b sticky top-0 z-10 transition-colors duration-1000`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">{theme.icon}</span>
              <span className={`text-xl font-bold ${theme.accentColor}`}>어른의 숲</span>
            </Link>

            {/* 네비게이션 */}
            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    pathname === link.href
                      ? `${theme.navActive} border-b-2 ${theme.accentBorder}`
                      : `text-gray-600 ${theme.accentHover}`
                  } pb-1 transition-colors`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              <PushNotificationToggle />
              <span className="text-sm text-gray-600">
                {user?.displayName || user?.email}
              </span>
              {user?.email === 'guest' ? (
                <Link
                  href="/login"
                  className={`text-sm ${theme.accentColor} font-medium transition-colors`}
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
      <nav className={`md:hidden ${theme.headerBg} border-b px-4 py-3 flex space-x-4 overflow-x-auto transition-colors duration-1000`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${
              pathname === link.href
                ? theme.navActiveBg
                : 'bg-gray-100 text-gray-600'
            } px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* 사용량 배너 */}
      <UsageBanner />

      {/* 메인 콘텐츠 */}
      <main>{children}</main>
    </div>
  );
}
