'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import UsageBanner from '@/components/UsageBanner';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import SplashScreen from '@/components/SplashScreen';
import { useTimeTheme } from '@/lib/hooks/useTimeTheme';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [user, setUser] = useState<any>(null);
  const theme = useTimeTheme();

  useEffect(() => {
    const checkAuth = async () => {
      // 게스트 모드: 인증 체크 우회
      if (!authApi.isAuthenticated()) {
        setUser({ email: 'guest', displayName: '게스트' });
        setAuthReady(true);
        return;
      }

      // 로그인된 경우: API 호출 (5초 타임아웃)
      const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      );

      try {
        const result = await Promise.race([
          authApi.getMe(),
          timeout(5000),
        ]) as { user: any };
        setUser(result.user);
      } catch {
        // 타임아웃 또는 API 에러 → 게스트로 진행
        setUser({ email: 'guest', displayName: '게스트' });
      } finally {
        setAuthReady(true);
      }
    };

    checkAuth();
  }, []);

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

  // 스플래시가 끝나지 않았거나 인증 체크가 안 끝났으면 스플래시 표시
  // 단, 스플래시는 최소 시간(2.8초) 후 종료되고, API가 느려도 5초 타임아웃
  if (!splashDone || !authReady) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
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
