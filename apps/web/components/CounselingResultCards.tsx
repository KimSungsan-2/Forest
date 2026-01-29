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
      const scale = 2;
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

// 감정별 색상 테마
function getEmotionTheme(emotion?: string) {
  const themes: Record<string, { bg1: string; bg2: string; accent: string; rain: string; label: string }> = {
    죄책감: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#5a7ea6', rain: '#5a7ea6', label: '무거운 마음' },
    분노: { bg1: '#2e1a1a', bg2: '#3e1616', accent: '#c0392b', rain: '#e74c3c', label: '타오르는 감정' },
    피로: { bg1: '#1a1a2e', bg2: '#2d2d44', accent: '#7f8c8d', rain: '#95a5a6', label: '지친 하루' },
    불안: { bg1: '#1a2e2e', bg2: '#163e3e', accent: '#1abc9c', rain: '#48c9b0', label: '불안한 마음' },
    슬픔: { bg1: '#1a1a3e', bg2: '#16163e', accent: '#3498db', rain: '#5dade2', label: '흐린 마음' },
    좌절: { bg1: '#2e2e1a', bg2: '#3e3e16', accent: '#d4a017', rain: '#f1c40f', label: '막막한 순간' },
    압도됨: { bg1: '#2e1a2e', bg2: '#3e163e', accent: '#8e44ad', rain: '#a569bd', label: '벅찬 감정' },
    외로움: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#34495e', rain: '#5d6d7e', label: '혼자인 기분' },
  };
  return themes[emotion || ''] || themes['죄책감'];
}

export default function CounselingResultCards({ emotion, emotionEmoji }: CounselingResultCardsProps) {
  const beforeSvgRef = useRef<SVGSVGElement>(null);
  const afterSvgRef = useRef<SVGSVGElement>(null);

  const handleDownload = useCallback(async (type: 'before' | 'after') => {
    const svgEl = type === 'before' ? beforeSvgRef.current : afterSvgRef.current;
    if (!svgEl) return;

    try {
      const canvas = await renderCardToCanvas(svgEl, 400, 520);
      downloadCanvasAsPng(canvas, `counseling-${type}.png`);
    } catch {
      alert('이미지 저장에 실패했습니다. 스크린샷을 이용해주세요.');
    }
  }, []);

  const theme = getEmotionTheme(emotion);
  const emotionLabel = emotion || '힘듦';
  const emoji = emotionEmoji || '😔';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-gray-800">나의 상담 전 &middot; 후</h3>
        <p className="text-sm text-gray-500">숲의 상담사가 그린 당신의 마음 여정</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ===== 상담 전 카드 ===== */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <svg
              ref={beforeSvgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 520"
              width="100%"
              height="auto"
              className="block"
            >
              <defs>
                <linearGradient id="bgBefore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.bg1} />
                  <stop offset="100%" stopColor={theme.bg2} />
                </linearGradient>
                <linearGradient id="cloudGray" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a5568" />
                  <stop offset="100%" stopColor="#2d3748" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="400" height="520" fill="url(#bgBefore)" />

              {/* 흐릿한 달 */}
              <circle cx="320" cy="70" r="35" fill="#555" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.3;0.2" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="325" cy="65" r="28" fill="url(#bgBefore)" />

              {/* 먹구름들 */}
              <ellipse cx="100" cy="100" rx="70" ry="35" fill="url(#cloudGray)" opacity="0.8">
                <animate attributeName="cx" values="100;115;100" dur="6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="180" cy="80" rx="60" ry="30" fill="url(#cloudGray)" opacity="0.9">
                <animate attributeName="cx" values="180;195;180" dur="7s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="300" cy="110" rx="55" ry="28" fill="url(#cloudGray)" opacity="0.7">
                <animate attributeName="cx" values="300;285;300" dur="5.5s" repeatCount="indefinite" />
              </ellipse>

              {/* 비 */}
              {[60, 110, 160, 210, 260, 310, 350].map((x, i) => (
                <line
                  key={`rain-${i}`}
                  x1={x}
                  y1={140 + i * 4}
                  x2={x - 4}
                  y2={158 + i * 4}
                  stroke={theme.rain}
                  strokeWidth="1.5"
                  opacity="0.5"
                >
                  <animate
                    attributeName="y1"
                    values={`${140 + i * 4};${320 + i * 3};${140 + i * 4}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    values={`${158 + i * 4};${338 + i * 3};${158 + i * 4}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                </line>
              ))}

              {/* 바닥 풀 (시든) */}
              {[40, 100, 180, 280, 350].map((x, i) => (
                <line key={`wilt-${i}`} x1={x} y1={395} x2={x + (i % 2 === 0 ? -8 : 8)} y2={378} stroke="#3d5a3d" strokeWidth="2" opacity="0.4" />
              ))}

              {/* 캐릭터 - 웅크린 모습 */}
              <g transform="translate(200, 295)">
                {/* 그림자 */}
                <ellipse cx="0" cy="95" rx="50" ry="8" fill="#000" opacity="0.15" />
                {/* 몸 */}
                <ellipse cx="0" cy="45" rx="48" ry="45" fill="#e0cdb0" />
                {/* 머리 */}
                <circle cx="0" cy="-10" r="38" fill="#f0dcc5" />
                {/* 머리카락 */}
                <path d="M-30,-35 Q-15,-55 0,-48 Q15,-55 30,-35" stroke="#8b7355" strokeWidth="6" fill="none" />
                {/* 눈 (감긴) */}
                <path d="M-16,-16 Q-10,-11 -4,-16" stroke="#666" strokeWidth="2.5" fill="none" />
                <path d="M4,-16 Q10,-11 16,-16" stroke="#666" strokeWidth="2.5" fill="none" />
                {/* 눈물 */}
                <ellipse cx="-13" cy="-6" rx="3" ry="5" fill={theme.accent} opacity="0.7">
                  <animate attributeName="cy" values="-6;8;-6" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="13" cy="-3" rx="2.5" ry="4" fill={theme.accent} opacity="0.5">
                  <animate attributeName="cy" values="-3;10;-3" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
                </ellipse>
                {/* 입 (슬픈) */}
                <path d="M-8,2 Q0,8 8,2" stroke="#888" strokeWidth="2" fill="none" />
                {/* 팔 (몸을 감싸는) */}
                <path d="M-38,15 Q-48,45 -15,55" stroke="#e0cdb0" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M38,15 Q48,45 15,55" stroke="#e0cdb0" strokeWidth="14" fill="none" strokeLinecap="round" />
                {/* 무릎 */}
                <ellipse cx="-18" cy="75" rx="18" ry="14" fill="#e0cdb0" />
                <ellipse cx="18" cy="75" rx="18" ry="14" fill="#e0cdb0" />
              </g>

              {/* 감정 아이콘 (떠다니는) */}
              <text x="80" y="220" fontSize="28" opacity="0.3" filter="url(#glow)">
                <animate attributeName="y" values="220;210;220" dur="3s" repeatCount="indefinite" />
                {emoji}
              </text>
              <text x="300" y="240" fontSize="22" opacity="0.2">
                <animate attributeName="y" values="240;230;240" dur="4s" repeatCount="indefinite" />
                💭
              </text>

              {/* 하단 텍스트 영역 */}
              <rect x="0" y="420" width="400" height="100" fill="#111827" opacity="0.5" />
              <text x="200" y="455" textAnchor="middle" fill="#d1d5db" fontFamily="sans-serif" fontSize="20" fontWeight="bold">
                상담 전
              </text>
              <text x="200" y="480" textAnchor="middle" fill={theme.accent} fontFamily="sans-serif" fontSize="14">
                {emoji} {theme.label}
              </text>
              <text x="200" y="505" textAnchor="middle" fill="#6b7280" fontFamily="sans-serif" fontSize="11" opacity="0.7">
                어른의 숲 | Forest of Calm
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('before')}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            📥 저장하기
          </button>
        </div>

        {/* ===== 상담 후 카드 ===== */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-green-200">
            <svg
              ref={afterSvgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 520"
              width="100%"
              height="auto"
              className="block"
            >
              <defs>
                <linearGradient id="bgAfter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8f5e9" />
                  <stop offset="40%" stopColor="#c8e6c9" />
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
                <radialGradient id="warmGlow" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#fffde7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fffde7" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="400" height="520" fill="url(#bgAfter)" />
              <rect width="400" height="520" fill="url(#warmGlow)" />

              {/* 태양 */}
              <circle cx="320" cy="75" r="65" fill="url(#sunRay)">
                <animate attributeName="r" values="65;75;65" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="320" cy="75" r="32" fill="url(#sunGlow)">
                <animate attributeName="r" values="32;35;32" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* 햇살 */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 320 + Math.cos(rad) * 40;
                const y1 = 75 + Math.sin(rad) * 40;
                const x2 = 320 + Math.cos(rad) * 55;
                const y2 = 75 + Math.sin(rad) * 55;
                return (
                  <line key={`ray-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd54f" strokeWidth="2" opacity="0.5">
                    <animate attributeName="opacity" values="0.5;0.8;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  </line>
                );
              })}

              {/* 흰 구름 */}
              <g opacity="0.85">
                <ellipse cx="90" cy="85" rx="45" ry="22" fill="white">
                  <animate attributeName="cx" values="90;110;90" dur="8s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="125" cy="75" rx="35" ry="18" fill="white">
                  <animate attributeName="cx" values="125;145;125" dur="9s" repeatCount="indefinite" />
                </ellipse>
              </g>

              {/* 무지개 (은은한) */}
              <path d="M50,180 Q200,60 350,180" fill="none" stroke="#ef5350" strokeWidth="3" opacity="0.15" />
              <path d="M55,185 Q200,68 345,185" fill="none" stroke="#ff9800" strokeWidth="3" opacity="0.12" />
              <path d="M60,190 Q200,76 340,190" fill="none" stroke="#ffeb3b" strokeWidth="3" opacity="0.10" />
              <path d="M65,195 Q200,84 335,195" fill="none" stroke="#4caf50" strokeWidth="3" opacity="0.12" />
              <path d="M70,200 Q200,92 330,200" fill="none" stroke="#2196f3" strokeWidth="3" opacity="0.10" />

              {/* 나무들 */}
              <g transform="translate(50, 340)">
                <rect x="-6" y="0" width="12" height="35" fill="#795548" rx="3" />
                <circle cx="0" cy="-12" r="22" fill="#66bb6a" />
                <circle cx="-12" cy="-2" r="15" fill="#43a047" />
              </g>
              <g transform="translate(355, 330)">
                <rect x="-7" y="0" width="14" height="40" fill="#6d4c41" rx="3" />
                <circle cx="0" cy="-15" r="28" fill="#4caf50" />
                <circle cx="-14" cy="-4" r="18" fill="#388e3c" />
                <circle cx="14" cy="-4" r="18" fill="#43a047" />
              </g>

              {/* 꽃들 */}
              {[80, 150, 240, 320].map((x, i) => (
                <g key={`flower-${i}`} transform={`translate(${x}, 388)`}>
                  <line x1="0" y1="0" x2="0" y2="25" stroke="#66bb6a" strokeWidth="2.5" />
                  <ellipse cx="-5" cy="12" rx="6" ry="3" fill="#81c784" transform="rotate(-30)" />
                  <circle cx="0" cy="-5" r={7 + (i % 2)} fill={['#ef5350', '#ba68c8', '#ffa726', '#ec407a'][i]}>
                    <animate attributeName="r" values={`${7 + (i % 2)};${8 + (i % 2)};${7 + (i % 2)}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="-5" r="3" fill="#fff9c4" />
                </g>
              ))}

              {/* 나비 1 */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="75,200;90,185;110,195;75,200" dur="6s" repeatCount="indefinite" />
                <ellipse cx="-7" cy="0" rx="7" ry="4.5" fill="#ba68c8" opacity="0.8">
                  <animate attributeName="rx" values="7;2;7" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="7" cy="0" rx="7" ry="4.5" fill="#ba68c8" opacity="0.8">
                  <animate attributeName="rx" values="7;2;7" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="0" cy="0" rx="1.5" ry="4" fill="#4a148c" />
              </g>
              {/* 나비 2 */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="280,170;300,160;310,175;280,170" dur="7s" repeatCount="indefinite" />
                <ellipse cx="-6" cy="0" rx="6" ry="4" fill="#ffab91" opacity="0.7">
                  <animate attributeName="rx" values="6;2;6" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="6" cy="0" rx="6" ry="4" fill="#ffab91" opacity="0.7">
                  <animate attributeName="rx" values="6;2;6" dur="0.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="0" cy="0" rx="1" ry="3" fill="#bf360c" />
              </g>

              {/* 캐릭터 - 밝고 활기찬 모습 */}
              <g transform="translate(200, 275)">
                {/* 그림자 (밝은) */}
                <ellipse cx="0" cy="105" rx="45" ry="7" fill="#388e3c" opacity="0.1" />
                {/* 몸 */}
                <ellipse cx="0" cy="45" rx="48" ry="45" fill="#f5e6d3" />
                {/* 머리 */}
                <circle cx="0" cy="-10" r="38" fill="#f5e6d3" />
                {/* 머리카락 */}
                <path d="M-30,-35 Q-15,-55 0,-48 Q15,-55 30,-35" stroke="#8b7355" strokeWidth="6" fill="none" />
                {/* 볼 터치 */}
                <circle cx="-20" cy="0" r="7" fill="#ffab91" opacity="0.45" />
                <circle cx="20" cy="0" r="7" fill="#ffab91" opacity="0.45" />
                {/* 눈 (반짝이는) */}
                <circle cx="-12" cy="-14" r="5" fill="#333" />
                <circle cx="12" cy="-14" r="5" fill="#333" />
                <circle cx="-10" cy="-15.5" r="2" fill="white" />
                <circle cx="14" cy="-15.5" r="2" fill="white" />
                <circle cx="-13" cy="-12.5" r="1" fill="white" opacity="0.6" />
                <circle cx="11" cy="-12.5" r="1" fill="white" opacity="0.6" />
                {/* 입 (활짝 미소) */}
                <path d="M-12,4 Q0,18 12,4" stroke="#555" strokeWidth="2.5" fill="none" />
                {/* 팔 (활짝 펼친) */}
                <path d="M-38,15 Q-65,-15 -75,-40" stroke="#f5e6d3" strokeWidth="14" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M-38,15 Q-65,-15 -75,-40;M-38,15 Q-68,-20 -80,-45;M-38,15 Q-65,-15 -75,-40" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M38,15 Q65,-15 75,-40" stroke="#f5e6d3" strokeWidth="14" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M38,15 Q65,-15 75,-40;M38,15 Q68,-20 80,-45;M38,15 Q65,-15 75,-40" dur="3s" repeatCount="indefinite" />
                </path>
                {/* 손 */}
                <circle cx="-75" cy="-40" r="7" fill="#f5e6d3" />
                <circle cx="75" cy="-40" r="7" fill="#f5e6d3" />
                {/* 하트 (머리 위) */}
                <g transform="translate(0, -65)">
                  <path d="M0,-10 C-6,-20 -18,-20 -18,-10 C-18,0 0,14 0,14 C0,14 18,0 18,-10 C18,-20 6,-20 0,-10Z" fill="#ef5350" opacity="0.85">
                    <animate attributeName="opacity" values="0.85;0.5;0.85" dur="1.5s" repeatCount="indefinite" />
                    <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.5s" repeatCount="indefinite" />
                  </path>
                </g>
                {/* 작은 반짝임 효과 */}
                <text x="-55" y="-50" fontSize="16" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                  ✨
                </text>
                <text x="45" y="-55" fontSize="14" opacity="0.5">
                  <animate attributeName="opacity" values="0;0.5;0" dur="2.5s" repeatCount="indefinite" />
                  ✨
                </text>
              </g>

              {/* 떠다니는 꽃잎 */}
              {[0, 1, 2].map((i) => (
                <ellipse
                  key={`petal-${i}`}
                  rx="4"
                  ry="6"
                  fill={['#f8bbd0', '#c8e6c9', '#ffe0b2'][i]}
                  opacity="0.5"
                  transform={`rotate(${i * 30})`}
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`${120 + i * 80},${150 + i * 20};${130 + i * 80},${250 + i * 15};${120 + i * 80},${150 + i * 20}`}
                    dur={`${4 + i}s`}
                    repeatCount="indefinite"
                  />
                </ellipse>
              ))}

              {/* 새 */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="60,130;80,120;100,130;60,130" dur="8s" repeatCount="indefinite" />
                <path d="M-8,0 Q0,-6 8,0" stroke="#555" strokeWidth="2" fill="none" />
                <path d="M-3,0 Q0,-4 3,0" stroke="#555" strokeWidth="2" fill="none" />
              </g>

              {/* 하단 텍스트 영역 */}
              <rect x="0" y="420" width="400" height="100" fill="#1b5e20" opacity="0.12" rx="0" />
              <text x="200" y="455" textAnchor="middle" fill="#2e7d32" fontFamily="sans-serif" fontSize="20" fontWeight="bold">
                상담 후
              </text>
              <text x="200" y="480" textAnchor="middle" fill="#43a047" fontFamily="sans-serif" fontSize="14">
                마음이 한결 가벼워졌어요 🌿
              </text>
              <text x="200" y="505" textAnchor="middle" fill="#66bb6a" fontFamily="sans-serif" fontSize="11" opacity="0.7">
                어른의 숲 | Forest of Calm
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('after')}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
          >
            📥 저장하기
          </button>
        </div>
      </div>

      {/* 전체 저장 */}
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
