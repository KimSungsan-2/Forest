'use client';

import { useRef, useCallback } from 'react';

interface CounselingResultCardsProps {
  emotion?: string;
  emotionEmoji?: string;
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function renderCardToCanvas(
  svgElement: SVGSVGElement,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // retina
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function CounselingResultCards({ emotion, emotionEmoji }: CounselingResultCardsProps) {
  const beforeSvgRef = useRef<SVGSVGElement>(null);
  const afterSvgRef = useRef<SVGSVGElement>(null);

  const handleDownload = useCallback(async (type: 'before' | 'after') => {
    const svgEl = type === 'before' ? beforeSvgRef.current : afterSvgRef.current;
    if (!svgEl) return;

    try {
      const canvas = await renderCardToCanvas(svgEl, 400, 500);
      downloadCanvasAsPng(canvas, `counseling-${type}.png`);
    } catch {
      alert('이미지 저장에 실패했습니다. 스크린샷을 이용해주세요.');
    }
  }, []);

  const emotionLabel = emotion || '힘듦';
  const emoji = emotionEmoji || '😔';

  return (
    <div className="space-y-6">
      <h3 className="text-center text-lg font-bold text-gray-800">
        나의 상담 전 &middot; 후
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* 상담 전 카드 */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <svg
              ref={beforeSvgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 500"
              width="100%"
              height="auto"
              className="block"
            >
              {/* 배경 - 어두운 그라데이션 */}
              <defs>
                <linearGradient id="bgBefore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a1a2e" />
                  <stop offset="100%" stopColor="#16213e" />
                </linearGradient>
                <linearGradient id="cloudGray" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a5568" />
                  <stop offset="100%" stopColor="#2d3748" />
                </linearGradient>
              </defs>
              <rect width="400" height="500" fill="url(#bgBefore)" />

              {/* 비구름 */}
              <ellipse cx="120" cy="100" rx="60" ry="35" fill="url(#cloudGray)" opacity="0.8">
                <animate attributeName="cx" values="120;130;120" dur="4s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="160" cy="85" rx="50" ry="30" fill="url(#cloudGray)" opacity="0.9">
                <animate attributeName="cx" values="160;170;160" dur="5s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="280" cy="110" rx="55" ry="32" fill="url(#cloudGray)" opacity="0.7">
                <animate attributeName="cx" values="280;270;280" dur="4.5s" repeatCount="indefinite" />
              </ellipse>

              {/* 비 */}
              {[80, 130, 180, 230, 280, 320].map((x, i) => (
                <line
                  key={`rain-${i}`}
                  x1={x}
                  y1={140 + i * 5}
                  x2={x - 5}
                  y2={160 + i * 5}
                  stroke="#5a7ea6"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="y1"
                    values={`${140 + i * 5};${300 + i * 5};${140 + i * 5}`}
                    dur={`${1.5 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    values={`${160 + i * 5};${320 + i * 5};${160 + i * 5}`}
                    dur={`${1.5 + i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </line>
              ))}

              {/* 캐릭터 - 웅크린 모습 */}
              <g transform="translate(200, 300)">
                {/* 몸 */}
                <ellipse cx="0" cy="40" rx="55" ry="50" fill="#e8d5b7" />
                {/* 머리 */}
                <circle cx="0" cy="-15" r="40" fill="#f5e6d3" />
                {/* 눈 (감긴) */}
                <path d="M-15,-20 Q-10,-15 -5,-20" stroke="#555" strokeWidth="2.5" fill="none" />
                <path d="M5,-20 Q10,-15 15,-20" stroke="#555" strokeWidth="2.5" fill="none" />
                {/* 입 (슬픈) */}
                <path d="M-10,-2 Q0,5 10,-2" stroke="#555" strokeWidth="2" fill="none" />
                {/* 눈물 */}
                <ellipse cx="-12" cy="-10" rx="3" ry="5" fill="#5a9fd4" opacity="0.8">
                  <animate attributeName="cy" values="-10;5;-10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </ellipse>
                {/* 팔 (감싸는) */}
                <path d="M-40,10 Q-50,40 -20,55" stroke="#e8d5b7" strokeWidth="16" fill="none" strokeLinecap="round" />
                <path d="M40,10 Q50,40 20,55" stroke="#e8d5b7" strokeWidth="16" fill="none" strokeLinecap="round" />
              </g>

              {/* 텍스트 */}
              <text x="200" y="420" textAnchor="middle" fill="#8899aa" fontFamily="sans-serif" fontSize="18" fontWeight="bold">
                상담 전
              </text>
              <text x="200" y="450" textAnchor="middle" fill="#667788" fontFamily="sans-serif" fontSize="14">
                {emoji} {emotionLabel}
              </text>

              {/* 어른의 숲 워터마크 */}
              <text x="200" y="485" textAnchor="middle" fill="#334455" fontFamily="sans-serif" fontSize="11" opacity="0.5">
                어른의 숲
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('before')}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span>📥</span> 저장하기
          </button>
        </div>

        {/* 상담 후 카드 */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-green-200">
            <svg
              ref={afterSvgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 500"
              width="100%"
              height="auto"
              className="block"
            >
              {/* 배경 - 밝은 그라데이션 */}
              <defs>
                <linearGradient id="bgAfter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0f7fa" />
                  <stop offset="50%" stopColor="#c8e6c9" />
                  <stop offset="100%" stopColor="#a5d6a7" />
                </linearGradient>
                <linearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff9c4" />
                  <stop offset="100%" stopColor="#ffee58" />
                </linearGradient>
                <radialGradient id="sunRay" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#fff9c4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="400" height="500" fill="url(#bgAfter)" />

              {/* 태양 */}
              <circle cx="320" cy="80" r="60" fill="url(#sunRay)">
                <animate attributeName="r" values="60;70;60" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="320" cy="80" r="30" fill="url(#sunGlow)">
                <animate attributeName="r" values="30;33;30" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* 흰 구름 */}
              <ellipse cx="100" cy="90" rx="50" ry="25" fill="white" opacity="0.8">
                <animate attributeName="cx" values="100;115;100" dur="6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="140" cy="78" rx="40" ry="22" fill="white" opacity="0.9">
                <animate attributeName="cx" values="140;155;140" dur="7s" repeatCount="indefinite" />
              </ellipse>

              {/* 꽃 / 풀 */}
              {[60, 140, 260, 340].map((x, i) => (
                <g key={`flower-${i}`} transform={`translate(${x}, 390)`}>
                  <line x1="0" y1="0" x2="0" y2="30" stroke="#66bb6a" strokeWidth="3" />
                  <circle cx="0" cy="-5" r="8" fill={['#ef5350', '#ab47bc', '#ffa726', '#ec407a'][i]}>
                    <animate attributeName="r" values="8;9;8" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="-5" r="3" fill="#fff9c4" />
                </g>
              ))}

              {/* 나비 */}
              <g transform="translate(80, 200)">
                <ellipse cx="-8" cy="0" rx="8" ry="5" fill="#ba68c8" opacity="0.8">
                  <animate attributeName="rx" values="8;3;8" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="8" cy="0" rx="8" ry="5" fill="#ba68c8" opacity="0.8">
                  <animate attributeName="rx" values="8;3;8" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
                <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="80,200;90,190;80,200" dur="4s" repeatCount="indefinite" />
              </g>

              {/* 캐릭터 - 밝은 모습 */}
              <g transform="translate(200, 280)">
                {/* 몸 */}
                <ellipse cx="0" cy="40" rx="55" ry="50" fill="#f5e6d3" />
                {/* 머리 */}
                <circle cx="0" cy="-15" r="40" fill="#f5e6d3" />
                {/* 볼 터치 */}
                <circle cx="-22" cy="-5" r="8" fill="#ffab91" opacity="0.5" />
                <circle cx="22" cy="-5" r="8" fill="#ffab91" opacity="0.5" />
                {/* 눈 (밝게 뜬) */}
                <circle cx="-12" cy="-18" r="5" fill="#333" />
                <circle cx="12" cy="-18" r="5" fill="#333" />
                <circle cx="-10" cy="-19" r="2" fill="white" />
                <circle cx="14" cy="-19" r="2" fill="white" />
                {/* 입 (밝은 미소) */}
                <path d="M-12,0 Q0,15 12,0" stroke="#333" strokeWidth="2.5" fill="none" />
                {/* 팔 (펼친) */}
                <path d="M-40,10 Q-65,-10 -70,-30" stroke="#f5e6d3" strokeWidth="16" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M-40,10 Q-65,-10 -70,-30;M-40,10 Q-65,-15 -75,-35;M-40,10 Q-65,-10 -70,-30" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M40,10 Q65,-10 70,-30" stroke="#f5e6d3" strokeWidth="16" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M40,10 Q65,-10 70,-30;M40,10 Q65,-15 75,-35;M40,10 Q65,-10 70,-30" dur="3s" repeatCount="indefinite" />
                </path>
                {/* 하트 */}
                <g transform="translate(0, -70)">
                  <path d="M0,-8 C-5,-16 -15,-16 -15,-8 C-15,0 0,10 0,10 C0,10 15,0 15,-8 C15,-16 5,-16 0,-8Z" fill="#ef5350" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite" />
                    <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="1.5s" repeatCount="indefinite" />
                  </path>
                </g>
              </g>

              {/* 나무 */}
              <g transform="translate(350, 340)">
                <rect x="-8" y="0" width="16" height="40" fill="#795548" rx="3" />
                <circle cx="0" cy="-15" r="30" fill="#66bb6a" />
                <circle cx="-15" cy="-5" r="20" fill="#43a047" />
                <circle cx="15" cy="-5" r="20" fill="#4caf50" />
              </g>

              {/* 텍스트 */}
              <text x="200" y="420" textAnchor="middle" fill="#2e7d32" fontFamily="sans-serif" fontSize="18" fontWeight="bold">
                상담 후
              </text>
              <text x="200" y="450" textAnchor="middle" fill="#388e3c" fontFamily="sans-serif" fontSize="14">
                마음이 한결 가벼워졌어요
              </text>

              {/* 어른의 숲 워터마크 */}
              <text x="200" y="485" textAnchor="middle" fill="#4caf50" fontFamily="sans-serif" fontSize="11" opacity="0.5">
                어른의 숲
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('after')}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span>📥</span> 저장하기
          </button>
        </div>
      </div>

      {/* 양쪽 동시 저장 */}
      <div className="text-center">
        <button
          onClick={async () => {
            await handleDownload('before');
            setTimeout(() => handleDownload('after'), 500);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
        >
          📥 전체 저장하기
        </button>
      </div>
    </div>
  );
}
