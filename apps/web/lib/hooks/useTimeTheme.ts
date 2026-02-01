'use client';

import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface TimeTheme {
  timeOfDay: TimeOfDay;
  greeting: string;
  bgGradient: string;
  headerBg: string;
  accentColor: string;
  accentHover: string;
  accentLight: string;
  accentBorder: string;
  navActive: string;
  navActiveBg: string;
  icon: string;
}

const THEMES: Record<TimeOfDay, TimeTheme> = {
  morning: {
    timeOfDay: 'morning',
    greeting: '좋은 아침이에요',
    bgGradient: 'bg-gradient-to-b from-amber-50/60 via-orange-50/30 to-gray-50',
    headerBg: 'bg-white/90 backdrop-blur-sm border-amber-100',
    accentColor: 'text-amber-700',
    accentHover: 'hover:text-amber-600',
    accentLight: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    navActive: 'text-amber-700',
    navActiveBg: 'bg-amber-100 text-amber-800',
    icon: '🌅',
  },
  afternoon: {
    timeOfDay: 'afternoon',
    greeting: '오늘 하루 어떠세요?',
    bgGradient: 'bg-gradient-to-b from-green-50/60 via-emerald-50/30 to-gray-50',
    headerBg: 'bg-white/90 backdrop-blur-sm border-green-100',
    accentColor: 'text-green-700',
    accentHover: 'hover:text-green-600',
    accentLight: 'bg-green-50',
    accentBorder: 'border-green-200',
    navActive: 'text-green-700',
    navActiveBg: 'bg-green-100 text-green-700',
    icon: '🌲',
  },
  evening: {
    timeOfDay: 'evening',
    greeting: '오늘 하루 수고했어요',
    bgGradient: 'bg-gradient-to-b from-indigo-50/60 via-purple-50/30 to-gray-50',
    headerBg: 'bg-white/90 backdrop-blur-sm border-indigo-100',
    accentColor: 'text-indigo-700',
    accentHover: 'hover:text-indigo-600',
    accentLight: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    navActive: 'text-indigo-700',
    navActiveBg: 'bg-indigo-100 text-indigo-800',
    icon: '🌙',
  },
};

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export function useTimeTheme(): TimeTheme {
  const [theme, setTheme] = useState<TimeTheme>(THEMES.afternoon);

  useEffect(() => {
    setTheme(THEMES[getTimeOfDay()]);

    // 매 분마다 체크해서 시간대 변경 반영
    const interval = setInterval(() => {
      setTheme(THEMES[getTimeOfDay()]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return theme;
}
