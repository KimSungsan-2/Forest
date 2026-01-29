'use client';

import { useRef, useCallback, useMemo } from 'react';

interface CounselingResultCardsProps {
  emotion?: string;
  emotionEmoji?: string;
  userContent?: string;
  aiContent?: string;
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
  const themes: Record<string, {
    bg1: string; bg2: string; accent: string; rain: string; label: string;
    afterBg1: string; afterBg2: string; afterAccent: string;
    sceneEmoji: string; healEmoji: string;
  }> = {
    죄책감: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#5a7ea6', rain: '#5a7ea6', label: '무거운 마음',
      afterBg1: '#e8f5e9', afterBg2: '#c8e6c9', afterAccent: '#66bb6a', sceneEmoji: '😔', healEmoji: '🌱' },
    분노: { bg1: '#2e1a1a', bg2: '#3e1616', accent: '#c0392b', rain: '#e74c3c', label: '타오르는 감정',
      afterBg1: '#fff3e0', afterBg2: '#ffe0b2', afterAccent: '#ff9800', sceneEmoji: '🔥', healEmoji: '🕊️' },
    피로: { bg1: '#1a1a2e', bg2: '#2d2d44', accent: '#7f8c8d', rain: '#95a5a6', label: '지친 하루',
      afterBg1: '#f3e5f5', afterBg2: '#e1bee7', afterAccent: '#ab47bc', sceneEmoji: '😩', healEmoji: '☕' },
    불안: { bg1: '#1a2e2e', bg2: '#163e3e', accent: '#1abc9c', rain: '#48c9b0', label: '불안한 마음',
      afterBg1: '#e0f7fa', afterBg2: '#b2ebf2', afterAccent: '#26c6da', sceneEmoji: '🌊', healEmoji: '🌤️' },
    슬픔: { bg1: '#1a1a3e', bg2: '#16163e', accent: '#3498db', rain: '#5dade2', label: '흐린 마음',
      afterBg1: '#e8eaf6', afterBg2: '#c5cae9', afterAccent: '#5c6bc0', sceneEmoji: '🌧️', healEmoji: '🌈' },
    좌절: { bg1: '#2e2e1a', bg2: '#3e3e16', accent: '#d4a017', rain: '#f1c40f', label: '막막한 순간',
      afterBg1: '#fff8e1', afterBg2: '#ffecb3', afterAccent: '#ffc107', sceneEmoji: '🧱', healEmoji: '🌻' },
    압도됨: { bg1: '#2e1a2e', bg2: '#3e163e', accent: '#8e44ad', rain: '#a569bd', label: '벅찬 감정',
      afterBg1: '#fce4ec', afterBg2: '#f8bbd0', afterAccent: '#ec407a', sceneEmoji: '🌀', healEmoji: '🦋' },
    외로움: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#34495e', rain: '#5d6d7e', label: '혼자인 기분',
      afterBg1: '#e0f2f1', afterBg2: '#b2dfdb', afterAccent: '#26a69a', sceneEmoji: '🌙', healEmoji: '🤝' },
  };
  return themes[emotion || ''] || themes['죄책감'];
}

// 사용자 내용에서 스토리 요약 추출
function extractStory(userContent?: string, aiContent?: string, emotion?: string) {
  const content = userContent || '';
  const ai = aiContent || '';

  // 사용자 내용에서 핵심 키워드 추출
  const keywords = {
    child: content.match(/아이|아들|딸|애|우리\s*애/) ? true : false,
    yelling: content.match(/소리|화[를을]?\s*[냈내]|짜증|폭발/) ? true : false,
    tired: content.match(/피곤|지[쳐치]|힘[들든]|지침|번아웃/) ? true : false,
    guilt: content.match(/죄책|미안|잘못|후회|자책/) ? true : false,
    work: content.match(/일|직장|회사|출근|퇴근|워킹/) ? true : false,
    sleep: content.match(/잠|수면|밤|깨[서]?|안\s*자/) ? true : false,
    food: content.match(/밥|안\s*먹|편식|식사/) ? true : false,
    screen: content.match(/TV|영상|유튜브|스크린|핸드폰|스마트폰/) ? true : false,
    fighting: content.match(/싸[우움]|다[퉈투]|갈등|남편|아내|배우자/) ? true : false,
    lonely: content.match(/혼자|외[롭로]|고립/) ? true : false,
  };

  // AI 킬링 문장 추출
  const killingMatch = ai.match(/==([^=]+)==/);
  const killingMessage = killingMatch ? killingMatch[1].trim() : '당신은 이미 충분히 좋은 부모입니다';

  // 상담 전 스토리 생성
  let beforeStory = '';
  let afterStory = '';
  let beforeScene = '폭풍우 속 혼자 서 있는 밤';
  let afterScene = '따뜻한 햇살이 비추는 숲';

  if (keywords.yelling) {
    beforeStory = '소리친 후 밀려오는 자책감';
    afterStory = '회복할 줄 아는 부모의 용기';
    beforeScene = '폭풍우 속 웅크린 밤';
    afterScene = '사과와 포옹이 피어나는 아침';
  } else if (keywords.tired) {
    beforeStory = '끝없는 피로에 잠긴 하루';
    afterStory = '쉬어도 된다는 허락';
    beforeScene = '무거운 안개에 갇힌 저녁';
    afterScene = '안개가 걷히며 보이는 따뜻한 빛';
  } else if (keywords.work) {
    beforeStory = '일과 육아 사이에서 찢기는 마음';
    afterStory = '노력하는 어른의 아름다운 모습';
    beforeScene = '출근길 뒤돌아보는 발걸음';
    afterScene = '퇴근 후 눈 맞추는 10분의 기적';
  } else if (keywords.sleep) {
    beforeStory = '잠 못 드는 밤의 고단함';
    afterStory = '뇌가 자라는 소리';
    beforeScene = '깜깜한 새벽 홀로 깨어있는 시간';
    afterScene = '아이와 함께 맞이하는 햇살';
  } else if (keywords.food) {
    beforeStory = '밥 한 숟갈의 전쟁';
    afterStory = '자율성이 자라나는 식탁';
    beforeScene = '뿌리치는 숟가락 앞의 답답함';
    afterScene = '스스로 집어먹는 작은 손';
  } else if (keywords.screen) {
    beforeStory = '스크린 앞에 아이를 둔 죄책감';
    afterStory = '생존 전략이자 지혜로운 선택';
    beforeScene = '어두운 방 화면빛만 비추는 저녁';
    afterScene = '함께 보며 대화하는 시간';
  } else if (keywords.fighting) {
    beforeStory = '아이 앞에서의 갈등';
    afterStory = '화해를 보여주는 것도 교육';
    beforeScene = '팽팽한 공기 속 얼어붙은 아이';
    afterScene = '손을 잡고 함께 웃는 가족';
  } else if (keywords.lonely) {
    beforeStory = '혼자 감당하는 무게';
    afterStory = '도움을 요청하는 용기';
    beforeScene = '텅 빈 방에 울리는 아이 울음';
    afterScene = '누군가와 나누는 따뜻한 대화';
  } else if (keywords.guilt) {
    beforeStory = '자책의 소용돌이';
    afterStory = '자책은 사랑의 증거';
    beforeScene = '어둠 속 자신을 탓하는 밤';
    afterScene = '사랑으로 다시 일어서는 아침';
  } else {
    beforeStory = emotion ? `${emotion}에 잠긴 하루` : '힘겨운 하루의 무게';
    afterStory = '마음의 짐을 내려놓는 순간';
    beforeScene = '어둠 속 홀로 걷는 길';
    afterScene = '숲에서 찾은 따뜻한 쉼터';
  }

  // 킬링 메시지를 30자로 자르기
  const shortKilling = killingMessage.length > 30
    ? killingMessage.substring(0, 28) + '...'
    : killingMessage;

  return { beforeStory, afterStory, beforeScene, afterScene, killingMessage: shortKilling };
}

export default function CounselingResultCards({ emotion, emotionEmoji, userContent, aiContent }: CounselingResultCardsProps) {
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

  const story = useMemo(
    () => extractStory(userContent, aiContent, emotion),
    [userContent, aiContent, emotion]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">나의 상담 전 · 후</h3>
        <p className="text-xs sm:text-sm text-gray-500">숲의 상담사가 그린 당신의 마음 여정</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* ===== 상담 전 카드 ===== */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-gray-200 w-full">
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
              <ellipse cx="250" cy="85" rx="60" ry="30" fill="url(#cloudGray)" opacity="0.9">
                <animate attributeName="cx" values="250;265;250" dur="7s" repeatCount="indefinite" />
              </ellipse>

              {/* 비 */}
              {[60, 130, 200, 270, 340].map((x, i) => (
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
                    values={`${140 + i * 4};${300 + i * 3};${140 + i * 4}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y2"
                    values={`${158 + i * 4};${318 + i * 3};${158 + i * 4}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                </line>
              ))}

              {/* 캐릭터 - 웅크린 모습 */}
              <g transform="translate(200, 270)">
                <ellipse cx="0" cy="95" rx="50" ry="8" fill="#000" opacity="0.15" />
                <ellipse cx="0" cy="45" rx="48" ry="45" fill="#e0cdb0" />
                <circle cx="0" cy="-10" r="38" fill="#f0dcc5" />
                <path d="M-30,-35 Q-15,-55 0,-48 Q15,-55 30,-35" stroke="#8b7355" strokeWidth="6" fill="none" />
                <path d="M-16,-16 Q-10,-11 -4,-16" stroke="#666" strokeWidth="2.5" fill="none" />
                <path d="M4,-16 Q10,-11 16,-16" stroke="#666" strokeWidth="2.5" fill="none" />
                <ellipse cx="-13" cy="-6" rx="3" ry="5" fill={theme.accent} opacity="0.7">
                  <animate attributeName="cy" values="-6;8;-6" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2.5s" repeatCount="indefinite" />
                </ellipse>
                <path d="M-8,2 Q0,8 8,2" stroke="#888" strokeWidth="2" fill="none" />
                <path d="M-38,15 Q-48,45 -15,55" stroke="#e0cdb0" strokeWidth="14" fill="none" strokeLinecap="round" />
                <path d="M38,15 Q48,45 15,55" stroke="#e0cdb0" strokeWidth="14" fill="none" strokeLinecap="round" />
                <ellipse cx="-18" cy="75" rx="18" ry="14" fill="#e0cdb0" />
                <ellipse cx="18" cy="75" rx="18" ry="14" fill="#e0cdb0" />
              </g>

              {/* 감정 아이콘 */}
              <text x="80" y="210" fontSize="28" opacity="0.3" filter="url(#glow)">
                <animate attributeName="y" values="210;200;210" dur="3s" repeatCount="indefinite" />
                {theme.sceneEmoji}
              </text>

              {/* 하단 스토리 텍스트 */}
              <rect x="0" y="400" width="400" height="120" fill="#111827" opacity="0.6" />
              <text x="200" y="430" textAnchor="middle" fill="#d1d5db" fontFamily="sans-serif" fontSize="18" fontWeight="bold">
                상담 전
              </text>
              <text x="200" y="455" textAnchor="middle" fill={theme.accent} fontFamily="sans-serif" fontSize="13">
                {emoji} {story.beforeStory}
              </text>
              <text x="200" y="478" textAnchor="middle" fill="#9ca3af" fontFamily="sans-serif" fontSize="11" opacity="0.8">
                {story.beforeScene}
              </text>
              <text x="200" y="505" textAnchor="middle" fill="#6b7280" fontFamily="sans-serif" fontSize="10" opacity="0.6">
                어른의 숲 | Forest of Calm
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('before')}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            📥 저장
          </button>
        </div>

        {/* ===== 상담 후 카드 ===== */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-green-200 w-full">
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
                  <stop offset="0%" stopColor={theme.afterBg1} />
                  <stop offset="40%" stopColor={theme.afterBg2} />
                  <stop offset="100%" stopColor={theme.afterAccent} stopOpacity="0.3" />
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
              <rect width="400" height="520" fill="url(#bgAfter)" />

              {/* 태양 */}
              <circle cx="320" cy="75" r="65" fill="url(#sunRay)">
                <animate attributeName="r" values="65;75;65" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="320" cy="75" r="32" fill="url(#sunGlow)">
                <animate attributeName="r" values="32;35;32" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* 햇살 */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
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

              {/* 무지개 */}
              <path d="M50,170 Q200,60 350,170" fill="none" stroke="#ef5350" strokeWidth="3" opacity="0.12" />
              <path d="M55,175 Q200,68 345,175" fill="none" stroke="#ff9800" strokeWidth="3" opacity="0.10" />
              <path d="M60,180 Q200,76 340,180" fill="none" stroke="#4caf50" strokeWidth="3" opacity="0.10" />

              {/* 나무 */}
              <g transform="translate(55, 330)">
                <rect x="-6" y="0" width="12" height="35" fill="#795548" rx="3" />
                <circle cx="0" cy="-12" r="22" fill="#66bb6a" />
              </g>
              <g transform="translate(350, 325)">
                <rect x="-7" y="0" width="14" height="38" fill="#6d4c41" rx="3" />
                <circle cx="0" cy="-15" r="26" fill="#4caf50" />
              </g>

              {/* 꽃들 */}
              {[100, 200, 300].map((x, i) => (
                <g key={`flower-${i}`} transform={`translate(${x}, 380)`}>
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#66bb6a" strokeWidth="2.5" />
                  <circle cx="0" cy="-5" r={6 + (i % 2)} fill={['#ef5350', '#ba68c8', '#ffa726'][i]}>
                    <animate attributeName="r" values={`${6 + (i % 2)};${7 + (i % 2)};${6 + (i % 2)}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="-5" r="2.5" fill="#fff9c4" />
                </g>
              ))}

              {/* 캐릭터 - 밝은 모습 */}
              <g transform="translate(200, 265)">
                <ellipse cx="0" cy="105" rx="45" ry="7" fill="#388e3c" opacity="0.1" />
                <ellipse cx="0" cy="45" rx="48" ry="45" fill="#f5e6d3" />
                <circle cx="0" cy="-10" r="38" fill="#f5e6d3" />
                <path d="M-30,-35 Q-15,-55 0,-48 Q15,-55 30,-35" stroke="#8b7355" strokeWidth="6" fill="none" />
                <circle cx="-20" cy="0" r="7" fill="#ffab91" opacity="0.45" />
                <circle cx="20" cy="0" r="7" fill="#ffab91" opacity="0.45" />
                <circle cx="-12" cy="-14" r="5" fill="#333" />
                <circle cx="12" cy="-14" r="5" fill="#333" />
                <circle cx="-10" cy="-15.5" r="2" fill="white" />
                <circle cx="14" cy="-15.5" r="2" fill="white" />
                <path d="M-12,4 Q0,18 12,4" stroke="#555" strokeWidth="2.5" fill="none" />
                <path d="M-38,15 Q-65,-15 -75,-40" stroke="#f5e6d3" strokeWidth="14" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M-38,15 Q-65,-15 -75,-40;M-38,15 Q-68,-20 -80,-45;M-38,15 Q-65,-15 -75,-40" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M38,15 Q65,-15 75,-40" stroke="#f5e6d3" strokeWidth="14" fill="none" strokeLinecap="round">
                  <animate attributeName="d" values="M38,15 Q65,-15 75,-40;M38,15 Q68,-20 80,-45;M38,15 Q65,-15 75,-40" dur="3s" repeatCount="indefinite" />
                </path>
                <circle cx="-75" cy="-40" r="7" fill="#f5e6d3" />
                <circle cx="75" cy="-40" r="7" fill="#f5e6d3" />
                {/* 하트 */}
                <g transform="translate(0, -65)">
                  <path d="M0,-10 C-6,-20 -18,-20 -18,-10 C-18,0 0,14 0,14 C0,14 18,0 18,-10 C18,-20 6,-20 0,-10Z" fill="#ef5350" opacity="0.85">
                    <animate attributeName="opacity" values="0.85;0.5;0.85" dur="1.5s" repeatCount="indefinite" />
                    <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.5s" repeatCount="indefinite" />
                  </path>
                </g>
                {/* 반짝임 */}
                <text x="-55" y="-50" fontSize="16" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                  {theme.healEmoji}
                </text>
              </g>

              {/* 나비 */}
              <g>
                <animateTransform attributeName="transform" type="translate" values="75,190;95,175;115,185;75,190" dur="6s" repeatCount="indefinite" />
                <ellipse cx="-6" cy="0" rx="6" ry="4" fill="#ba68c8" opacity="0.7">
                  <animate attributeName="rx" values="6;2;6" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="6" cy="0" rx="6" ry="4" fill="#ba68c8" opacity="0.7">
                  <animate attributeName="rx" values="6;2;6" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="0" cy="0" rx="1" ry="3" fill="#4a148c" />
              </g>

              {/* 하단 스토리 텍스트 */}
              <rect x="0" y="400" width="400" height="120" fill="#1b5e20" opacity="0.12" />
              <text x="200" y="430" textAnchor="middle" fill="#2e7d32" fontFamily="sans-serif" fontSize="18" fontWeight="bold">
                상담 후
              </text>
              <text x="200" y="455" textAnchor="middle" fill={theme.afterAccent} fontFamily="sans-serif" fontSize="13">
                {theme.healEmoji} {story.afterStory}
              </text>
              <text x="200" y="478" textAnchor="middle" fill="#66bb6a" fontFamily="sans-serif" fontSize="11" opacity="0.8">
                {story.afterScene}
              </text>
              <text x="200" y="505" textAnchor="middle" fill="#81c784" fontFamily="sans-serif" fontSize="10" opacity="0.6">
                어른의 숲 | Forest of Calm
              </text>
            </svg>
          </div>
          <button
            onClick={() => handleDownload('after')}
            className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
          >
            📥 저장
          </button>
        </div>
      </div>

      {/* 킬링 메시지 배너 */}
      {story.killingMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-sm sm:text-base font-medium text-green-800 italic">
            &ldquo;{story.killingMessage}&rdquo;
          </p>
        </div>
      )}

      {/* 전체 저장 */}
      <div className="text-center">
        <button
          onClick={async () => {
            await handleDownload('before');
            setTimeout(() => handleDownload('after'), 500);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
        >
          📥 전체 저장하기
        </button>
      </div>
    </div>
  );
}
