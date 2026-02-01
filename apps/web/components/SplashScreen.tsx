'use client';

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    '오늘도 좋은 부모가 되려고 노력한 당신, 대단해요',
    '완벽한 부모는 없어요. 있는 그대로 충분해요',
    '잠깐 멈추고 숨을 쉬어도 괜찮아요',
    '아이에게 미안한 마음이 드는 건, 사랑하기 때문이에요',
    '힘든 하루를 견딘 것만으로도 충분해요',
  ];

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * tips.length));

    // enter → show
    const t1 = setTimeout(() => setPhase('show'), 100);
    // show → exit
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    // exit → done
    const t3 = setTimeout(() => onFinish(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(145deg, #ecfdf5 0%, #f0fdf4 30%, #fefce8 70%, #fff7ed 100%)',
      }}
    >
      {/* Floating leaves background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] text-3xl opacity-20 animate-float-slow">
          🍃
        </div>
        <div className="absolute top-[25%] right-[15%] text-2xl opacity-15 animate-float-medium">
          🌿
        </div>
        <div className="absolute bottom-[30%] left-[20%] text-2xl opacity-15 animate-float-slow" style={{ animationDelay: '1s' }}>
          🌱
        </div>
        <div className="absolute bottom-[20%] right-[12%] text-3xl opacity-10 animate-float-medium" style={{ animationDelay: '0.5s' }}>
          🍂
        </div>
        <div className="absolute top-[50%] left-[50%] text-xl opacity-10 animate-float-slow" style={{ animationDelay: '1.5s' }}>
          🌾
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center px-8">
        {/* Logo icon */}
        <div
          className={`transition-all duration-700 ease-out ${
            phase === 'enter'
              ? 'scale-50 opacity-0'
              : 'scale-100 opacity-100'
          }`}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-green-200/50 rotate-3">
            <span className="text-4xl sm:text-5xl drop-shadow-sm" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
              🌲
            </span>
          </div>
        </div>

        {/* App name */}
        <div
          className={`mt-5 transition-all duration-700 delay-200 ease-out ${
            phase === 'enter'
              ? 'translate-y-4 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            어른의 숲
          </h1>
        </div>

        {/* Subtitle */}
        <div
          className={`mt-2 transition-all duration-700 delay-300 ease-out ${
            phase === 'enter'
              ? 'translate-y-4 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <p className="text-sm text-green-600/70 font-medium">
            부모의 마음을 돌보는 공간
          </p>
        </div>

        {/* Divider */}
        <div
          className={`mt-6 w-8 h-px bg-green-300/50 transition-all duration-700 delay-500 ease-out ${
            phase === 'enter'
              ? 'w-0 opacity-0'
              : 'w-8 opacity-100'
          }`}
        />

        {/* Daily tip */}
        <div
          className={`mt-5 max-w-[280px] transition-all duration-700 delay-[600ms] ease-out ${
            phase === 'enter'
              ? 'translate-y-3 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <p className="text-center text-sm text-gray-500 leading-relaxed">
            {tips[tipIndex]}
          </p>
        </div>
      </div>

      {/* Bottom loading indicator */}
      <div
        className={`absolute bottom-12 transition-all duration-500 delay-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse [animation-delay:0.3s]" />
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse [animation-delay:0.6s]" />
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }
        :global(.animate-float-slow) {
          animation: float-slow 6s ease-in-out infinite;
        }
        :global(.animate-float-medium) {
          animation: float-medium 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
