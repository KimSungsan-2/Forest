'use client';

import { useState, useEffect } from 'react';

const LOADING_STAGES = [
  { message: '당신의 이야기를 천천히 읽고 있어요', icon: '📖', duration: 3000 },
  { message: '비슷한 마음을 가진 부모님들의 사례를 살펴보고 있어요', icon: '🔍', duration: 4000 },
  { message: '따뜻한 말을 고르고 있어요', icon: '✍️', duration: 3500 },
  { message: '아이와의 관계에 대해 생각하고 있어요', icon: '👶', duration: 3000 },
  { message: '당신의 감정에 공감하며 답변을 준비하고 있어요', icon: '💚', duration: 4000 },
  { message: '육아 심리학 자료를 참고하고 있어요', icon: '📚', duration: 3500 },
  { message: '가장 도움이 될 이야기를 정리하고 있어요', icon: '🌿', duration: 3000 },
  { message: '거의 다 됐어요, 조금만 기다려주세요', icon: '🌲', duration: 5000 },
];

const FOLLOW_UP_STAGES = [
  { message: '대화 흐름을 이해하고 있어요', icon: '💬', duration: 2500 },
  { message: '더 깊이 공감하는 중이에요', icon: '💚', duration: 3000 },
  { message: '맞춤 답변을 준비하고 있어요', icon: '✨', duration: 3000 },
  { message: '거의 다 됐어요', icon: '🌿', duration: 5000 },
];

interface CounselingLoaderProps {
  isFollowUp?: boolean;
}

export default function CounselingLoader({ isFollowUp = false }: CounselingLoaderProps) {
  const stages = isFollowUp ? FOLLOW_UP_STAGES : LOADING_STAGES;
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentIndex = 0;

    const advance = () => {
      setFadeIn(false);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % stages.length;
        setStageIndex(currentIndex);
        setFadeIn(true);
      }, 300);
    };

    const timers: NodeJS.Timeout[] = [];
    let elapsed = 0;

    stages.forEach((stage, i) => {
      if (i > 0) {
        timers.push(setTimeout(advance, elapsed));
      }
      elapsed += stage.duration;
    });

    // Loop back after all stages
    const loopTimer = setInterval(() => {
      advance();
    }, elapsed);
    timers.push(loopTimer);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loopTimer);
    };
  }, [stages]);

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // Never reach 100 until actual response
        return prev + 0.3;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const stage = stages[stageIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" />

      {/* Progress bar */}
      <div className="relative h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start gap-3">
          {/* Avatar with pulse */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-lg">
              🌲
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>

          {/* Message area */}
          <div className="flex-1 pt-0.5">
            {/* Typing dots */}
            <div className="flex items-center space-x-1.5 mb-2.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>

            {/* Rotating message */}
            <div className="min-h-[24px]">
              <p
                className={`text-sm text-green-700 font-medium transition-all duration-300 ${
                  fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                }`}
              >
                <span className="mr-1.5">{stage.icon}</span>
                {stage.message}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative leaves */}
        <div className="absolute top-3 right-3 opacity-10 text-2xl select-none pointer-events-none">
          🍃
        </div>
        <div className="absolute bottom-2 right-8 opacity-[0.07] text-3xl select-none pointer-events-none rotate-45">
          🌿
        </div>
      </div>
    </div>
  );
}
