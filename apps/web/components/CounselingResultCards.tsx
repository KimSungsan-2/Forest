'use client';

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

// ===== 주제 감지 =====
type SceneTopic = 'play' | 'yelling' | 'tired' | 'work' | 'sleep' | 'food' | 'screen' | 'fighting' | 'lonely' | 'default';

function detectTopic(content: string): SceneTopic {
  if (content.match(/놀[이아]|역할|인형|장난감|블록|소꿉|레고|그리기|만들기/)) return 'play';
  if (content.match(/소리|화[를을]?\s*[냈내]|짜증|폭발|버럭|소리지/)) return 'yelling';
  if (content.match(/피곤|지[쳐치]|힘[들든]|번아웃|탈진|기력/)) return 'tired';
  if (content.match(/일|직장|회사|출근|퇴근|워킹|업무|야근/)) return 'work';
  if (content.match(/잠|수면|밤|깨[서]?|안\s*자|새벽|불면/)) return 'sleep';
  if (content.match(/밥|안\s*먹|편식|식사|먹[지이]|수유|분유|이유식/)) return 'food';
  if (content.match(/TV|영상|유튜브|스크린|핸드폰|스마트폰|태블릿|미디어/)) return 'screen';
  if (content.match(/싸[우움]|다[퉈투]|갈등|남편|아내|배우자|부부/)) return 'fighting';
  if (content.match(/혼자|외[롭로]|고립|도움|나눌\s*사람/)) return 'lonely';
  return 'default';
}

// ===== 컨텐츠 해시로 변형 번호 생성 =====
function getVariant(content: string, maxVariants: number): number {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % maxVariants;
}

// ===== 주제별 색상 & 텍스트 (변형 지원) =====
interface SceneTheme {
  before: { bg1: string; bg2: string; accent: string };
  after: { bg1: string; bg2: string; accent: string };
  beforeTitle: string;
  afterTitle: string;
  beforeScene: string;
  afterScene: string;
}

function getSceneTheme(topic: SceneTopic, emotion?: string, variant: number = 0): SceneTheme {
  // 주제별로 4가지 변형 테마
  const themeVariants: Record<SceneTopic, SceneTheme[]> = {
    play: [
      {
        before: { bg1: '#2d2d44', bg2: '#1a1a2e', accent: '#9b59b6' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#66bb6a' },
        beforeTitle: '지친 놀이 시간',
        afterTitle: '함께하는 즐거운 놀이',
        beforeScene: '바닥에 흩어진 장난감과 지친 마음',
        afterScene: '인형과 함께 웃으며 잠든 가족',
      },
      {
        before: { bg1: '#3e2723', bg2: '#4e342e', accent: '#ff7043' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ffb74d' },
        beforeTitle: '끝없는 놀이 요청',
        afterTitle: '서로의 세계를 나누는 순간',
        beforeScene: '몇 번째인지 모를 역할놀이 요청',
        afterScene: '아이의 상상 속 세계에 초대받은 부모',
      },
      {
        before: { bg1: '#263238', bg2: '#37474f', accent: '#78909c' },
        after: { bg1: '#e1f5fe', bg2: '#b3e5fc', accent: '#4fc3f7' },
        beforeTitle: '놀아달라는 마음의 무게',
        afterTitle: '10분의 마법 같은 시간',
        beforeScene: '쏟아지는 요구와 지쳐가는 에너지',
        afterScene: '짧지만 온전히 함께한 따뜻한 시간',
      },
      {
        before: { bg1: '#1a2636', bg2: '#2a3a4e', accent: '#64b5f6' },
        after: { bg1: '#fce4ec', bg2: '#f8bbd0', accent: '#f06292' },
        beforeTitle: '또 같은 놀이의 반복',
        afterTitle: '반복 속에 피어난 새로운 순간',
        beforeScene: '매일 같은 이야기를 반복하는 지루함',
        afterScene: '익숙한 놀이에서 발견한 아이의 성장',
      },
    ],
    yelling: [
      {
        before: { bg1: '#2e1a1a', bg2: '#3e1616', accent: '#e74c3c' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ff9800' },
        beforeTitle: '폭풍 속의 후회',
        afterTitle: '포옹으로 회복하는 아침',
        beforeScene: '번개와 함께 터진 감정의 소리',
        afterScene: '사과와 포옹이 피어나는 따뜻한 순간',
      },
      {
        before: { bg1: '#1a1a2e', bg2: '#2d1b2e', accent: '#f44336' },
        after: { bg1: '#f3e5f5', bg2: '#e1bee7', accent: '#ce93d8' },
        beforeTitle: '돌이킬 수 없는 한마디',
        afterTitle: '눈물로 이어지는 화해',
        beforeScene: '입에서 튀어나온 말이 만든 고요',
        afterScene: '서로의 눈을 보며 다시 시작하는 용기',
      },
      {
        before: { bg1: '#311b00', bg2: '#4a2600', accent: '#ff6f00' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#81c784' },
        beforeTitle: '감정의 화산이 터진 순간',
        afterTitle: '다시 잡은 작은 손',
        beforeScene: '참고 참다 터져버린 뜨거운 감정',
        afterScene: '아이가 먼저 내민 손을 잡는 순간',
      },
      {
        before: { bg1: '#1a0a0a', bg2: '#2d1515', accent: '#ff5252' },
        after: { bg1: '#e0f2f1', bg2: '#b2dfdb', accent: '#4db6ac' },
        beforeTitle: '멈출 수 없었던 목소리',
        afterTitle: '조용히 안아준 뒤의 평화',
        beforeScene: '내 목소리에 놀란 건 아이보다 나였다',
        afterScene: '말 대신 안아주었을 때 흐른 고요',
      },
    ],
    tired: [
      {
        before: { bg1: '#1a1a2e', bg2: '#2d2d44', accent: '#7f8c8d' },
        after: { bg1: '#f3e5f5', bg2: '#e1bee7', accent: '#ab47bc' },
        beforeTitle: '끝없는 피로의 무게',
        afterTitle: '쉬어도 된다는 허락',
        beforeScene: '어깨 위 무거운 짐을 진 하루',
        afterScene: '커피 한 잔과 함께 찾은 여유',
      },
      {
        before: { bg1: '#212121', bg2: '#424242', accent: '#9e9e9e' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffd54f' },
        beforeTitle: '잠도 쉼도 없는 하루',
        afterTitle: '작은 쉼표가 만든 큰 변화',
        beforeScene: '눈 뜨자마자 시작된 끝없는 하루',
        afterScene: '5분의 조용한 차 한 잔이 선물한 평화',
      },
      {
        before: { bg1: '#1b2631', bg2: '#2c3e50', accent: '#5d6d7e' },
        after: { bg1: '#e0f2f1', bg2: '#b2dfdb', accent: '#4db6ac' },
        beforeTitle: '텅 빈 배터리의 경고',
        afterTitle: '충전을 시작한 마음',
        beforeScene: '0%로 깜빡이는 마음의 배터리',
        afterScene: '천천히 차오르는 에너지의 초록빛',
      },
      {
        before: { bg1: '#1a1a1a', bg2: '#2d2d2d', accent: '#b0bec5' },
        after: { bg1: '#e8eaf6', bg2: '#c5cae9', accent: '#7986cb' },
        beforeTitle: '쉬고 싶다는 말이 사치인 하루',
        afterTitle: '3분의 숨, 하루를 바꾸는 쉼표',
        beforeScene: '아픈데도 일어나야 하는 아침',
        afterScene: '짧은 호흡이 선물한 작은 여유',
      },
    ],
    work: [
      {
        before: { bg1: '#1a2e2e', bg2: '#0d1b2a', accent: '#3498db' },
        after: { bg1: '#e0f7fa', bg2: '#b2ebf2', accent: '#26c6da' },
        beforeTitle: '일과 육아 사이',
        afterTitle: '퇴근 후 10분의 기적',
        beforeScene: '갈라진 두 세계 사이에서',
        afterScene: '따뜻한 불빛이 새어 나오는 집',
      },
      {
        before: { bg1: '#1a237e', bg2: '#0d47a1', accent: '#5c6bc0' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ffb74d' },
        beforeTitle: '두 역할 사이의 죄책감',
        afterTitle: '완벽하지 않아도 괜찮은 저녁',
        beforeScene: '회의실에서 울리는 아이 사진 알림',
        afterScene: '현관문을 열자 달려오는 작은 발소리',
      },
      {
        before: { bg1: '#263238', bg2: '#37474f', accent: '#607d8b' },
        after: { bg1: '#fce4ec', bg2: '#f8bbd0', accent: '#f48fb1' },
        beforeTitle: '야근의 그림자',
        afterTitle: '잠든 아이 옆에 누운 밤',
        beforeScene: '모니터 불빛 아래 놓인 가족 사진',
        afterScene: '아이의 작은 숨소리를 듣는 평화',
      },
      {
        before: { bg1: '#0d1b2a', bg2: '#1b3a4b', accent: '#4a90d9' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ff8a65' },
        beforeTitle: '출근길의 죄책감',
        afterTitle: '현관에서 받은 뜨거운 포옹',
        beforeScene: '뒤돌아볼 때마다 작아지는 아이의 모습',
        afterScene: '"다녀오세요!" 외치는 작은 목소리의 힘',
      },
    ],
    sleep: [
      {
        before: { bg1: '#0d1b2a', bg2: '#1b2838', accent: '#2c3e50' },
        after: { bg1: '#e8eaf6', bg2: '#c5cae9', accent: '#5c6bc0' },
        beforeTitle: '잠 못 드는 새벽',
        afterTitle: '별빛 아래 평화로운 잠',
        beforeScene: '시계만 째깍거리는 어둠 속',
        afterScene: '아이와 함께 맞이하는 고요한 밤',
      },
      {
        before: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#34495e' },
        after: { bg1: '#f3e5f5', bg2: '#e1bee7', accent: '#ba68c8' },
        beforeTitle: '새벽 3시의 절망',
        afterTitle: '아이와 함께 꾸는 꿈',
        beforeScene: '몇 번째인지 모를 새벽 기상',
        afterScene: '서로의 온기로 채운 포근한 이불 속',
      },
      {
        before: { bg1: '#0d1117', bg2: '#161b22', accent: '#484f58' },
        after: { bg1: '#e0f7fa', bg2: '#b2ebf2', accent: '#4dd0e1' },
        beforeTitle: '밤이 두려운 부모',
        afterTitle: '새벽달이 비추는 고요',
        beforeScene: '잠든 아이 옆에서 뜬 눈으로 보내는 밤',
        afterScene: '달빛 아래 평화롭게 잠든 두 사람',
      },
      {
        before: { bg1: '#120e1c', bg2: '#1e1830', accent: '#7e57c2' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffca28' },
        beforeTitle: '끊기지 않는 밤의 울음',
        afterTitle: '함께 맞이한 첫 햇살',
        beforeScene: '시계를 보는 것도 포기한 새벽',
        afterScene: '창문 사이로 스며든 아침의 따뜻함',
      },
    ],
    food: [
      {
        before: { bg1: '#2e2e1a', bg2: '#3e3e16', accent: '#d4a017' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffc107' },
        beforeTitle: '밥 한 숟갈의 전쟁',
        afterTitle: '함께 먹는 따뜻한 식탁',
        beforeScene: '뒤집힌 그릇과 흩어진 음식',
        afterScene: '스스로 숟가락을 든 작은 손',
      },
      {
        before: { bg1: '#3e2723', bg2: '#4e342e', accent: '#8d6e63' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#66bb6a' },
        beforeTitle: '안 먹겠다는 작은 입술',
        afterTitle: '한 입의 작은 승리',
        beforeScene: '꼭 다문 입과 고개 돌린 아이',
        afterScene: '엄지를 치켜세우며 한 숟갈 넘기는 순간',
      },
      {
        before: { bg1: '#1a2e1a', bg2: '#2d3e2d', accent: '#795548' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ff9800' },
        beforeTitle: '식탁 위의 눈물',
        afterTitle: '같이 만든 오늘의 간식',
        beforeScene: '바닥에 떨어진 반찬과 지친 한숨',
        afterScene: '반죽을 주무르며 웃는 두 쌍의 손',
      },
      {
        before: { bg1: '#2e1f0f', bg2: '#3d2b16', accent: '#a1887f' },
        after: { bg1: '#e0f7fa', bg2: '#b2ebf2', accent: '#4dd0e1' },
        beforeTitle: '한 숟갈도 넘기지 않는 아이',
        afterTitle: '스스로 고른 오늘의 메뉴',
        beforeScene: '30분째 한 자리에서 이어지는 식사 전쟁',
        afterScene: '작은 손으로 직접 담은 자기만의 접시',
      },
    ],
    screen: [
      {
        before: { bg1: '#1a1a3e', bg2: '#16163e', accent: '#5dade2' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#4caf50' },
        beforeTitle: '스크린 앞의 죄책감',
        afterTitle: '함께 보는 시간의 가치',
        beforeScene: '어두운 방, 화면만 빛나는 저녁',
        afterScene: '나무 아래 책을 읽는 가족',
      },
      {
        before: { bg1: '#212121', bg2: '#303030', accent: '#2196f3' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffd54f' },
        beforeTitle: '리모컨을 건넨 자책',
        afterTitle: '화면 속 세상을 나누는 대화',
        beforeScene: '조용해진 집과 빛나는 화면',
        afterScene: '같이 보며 이야기하는 따뜻한 시간',
      },
      {
        before: { bg1: '#1a237e', bg2: '#283593', accent: '#7986cb' },
        after: { bg1: '#f3e5f5', bg2: '#e1bee7', accent: '#ab47bc' },
        beforeTitle: '꺼지지 않는 화면',
        afterTitle: '대신 켜진 상상력의 불빛',
        beforeScene: '끄려다 포기한 지쳐버린 저녁',
        afterScene: '크레용으로 그린 오늘의 모험',
      },
      {
        before: { bg1: '#0f0f2e', bg2: '#1a1a3e', accent: '#448aff' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#66bb6a' },
        beforeTitle: '화면에 맡긴 시간의 무게',
        afterTitle: '손잡고 나선 바깥 세상',
        beforeScene: '조용해진 집이 편하면서도 불안한 저녁',
        afterScene: '현관 앞 작은 모험이 시작되는 순간',
      },
    ],
    fighting: [
      {
        before: { bg1: '#2e1a2e', bg2: '#3e163e', accent: '#8e44ad' },
        after: { bg1: '#fce4ec', bg2: '#f8bbd0', accent: '#ec407a' },
        beforeTitle: '갈라진 마음의 틈',
        afterTitle: '다시 잡은 손',
        beforeScene: '서로 등진 두 사람 사이의 균열',
        afterScene: '손을 잡고 함께 웃는 가족',
      },
      {
        before: { bg1: '#1b2631', bg2: '#2c3e50', accent: '#e74c3c' },
        after: { bg1: '#e0f7fa', bg2: '#b2ebf2', accent: '#26c6da' },
        beforeTitle: '차가운 침묵의 밤',
        afterTitle: '먼저 건넨 따뜻한 한마디',
        beforeScene: '같은 방에서 다른 곳을 보는 두 사람',
        afterScene: '"미안해"라는 말이 녹인 얼음',
      },
      {
        before: { bg1: '#311b92', bg2: '#4527a0', accent: '#b39ddb' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#81c784' },
        beforeTitle: '엇갈린 마음의 소리',
        afterTitle: '같은 방향을 바라보는 눈',
        beforeScene: '각자의 정의 사이에서 흔들리는 가족',
        afterScene: '아이를 위해 하나 된 마음',
      },
      {
        before: { bg1: '#1a0a20', bg2: '#2d1638', accent: '#ce93d8' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffd54f' },
        beforeTitle: '같은 집, 다른 세계',
        afterTitle: '식탁에서 시작된 대화',
        beforeScene: '각자의 화면만 바라보는 조용한 저녁',
        afterScene: '"오늘 어땠어?"라는 한마디가 열어준 문',
      },
    ],
    lonely: [
      {
        before: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#34495e' },
        after: { bg1: '#e0f2f1', bg2: '#b2dfdb', accent: '#26a69a' },
        beforeTitle: '혼자 감당하는 무게',
        afterTitle: '연결된 따뜻한 손길',
        beforeScene: '텅 빈 방에 홀로 앉은 밤',
        afterScene: '누군가와 나누는 따뜻한 대화',
      },
      {
        before: { bg1: '#212121', bg2: '#303030', accent: '#616161' },
        after: { bg1: '#fff3e0', bg2: '#ffe0b2', accent: '#ffb74d' },
        beforeTitle: '나만 힘든 걸까',
        afterTitle: '같은 마음을 가진 누군가',
        beforeScene: '다들 잘하는 것 같은데 나만 허덕이는 기분',
        afterScene: '"저도 그래요"라는 한마디가 주는 위로',
      },
      {
        before: { bg1: '#0d1b2a', bg2: '#1b2838', accent: '#455a64' },
        after: { bg1: '#f3e5f5', bg2: '#e1bee7', accent: '#ce93d8' },
        beforeTitle: '고립된 섬 위의 부모',
        afterTitle: '다리가 놓인 마음',
        beforeScene: '도움을 요청할 곳 없는 외로운 밤',
        afterScene: '이해받는다는 느낌이 만든 따뜻한 다리',
      },
      {
        before: { bg1: '#1b1b2f', bg2: '#162447', accent: '#546e7a' },
        after: { bg1: '#fce4ec', bg2: '#f8bbd0', accent: '#ec407a' },
        beforeTitle: '아무도 모르는 내 하루',
        afterTitle: '같은 마음끼리 나누는 온기',
        beforeScene: 'SNS 속 행복한 가족 사이에서 느끼는 거리감',
        afterScene: '"저도 그래요"라는 말이 녹인 벽',
      },
    ],
    default: [
      {
        before: { bg1: '#1a1a2e', bg2: '#16213e', accent: '#5a7ea6' },
        after: { bg1: '#e8f5e9', bg2: '#c8e6c9', accent: '#66bb6a' },
        beforeTitle: emotion ? `${emotion}에 잠긴 하루` : '힘겨운 하루의 무게',
        afterTitle: '마음의 짐을 내려놓는 순간',
        beforeScene: '어둠 속 홀로 걷는 길',
        afterScene: '숲에서 찾은 따뜻한 쉼터',
      },
      {
        before: { bg1: '#263238', bg2: '#37474f', accent: '#78909c' },
        after: { bg1: '#fff8e1', bg2: '#ffecb3', accent: '#ffd54f' },
        beforeTitle: emotion ? `${emotion}의 안개 속` : '안개 낀 마음의 길',
        afterTitle: '안개가 걷히는 아침',
        beforeScene: '앞이 보이지 않는 불안한 발걸음',
        afterScene: '햇살이 비추며 선명해지는 길',
      },
      {
        before: { bg1: '#1b2631', bg2: '#2c3e50', accent: '#5d6d7e' },
        after: { bg1: '#fce4ec', bg2: '#f8bbd0', accent: '#f48fb1' },
        beforeTitle: emotion ? `${emotion}이 찾아온 밤` : '무거운 마음의 밤',
        afterTitle: '새벽빛이 스미는 창가',
        beforeScene: '어두운 밤하늘 아래 웅크린 마음',
        afterScene: '첫 빛이 내리는 희망의 창가',
      },
      {
        before: { bg1: '#1a1a2e', bg2: '#0f3460', accent: '#e94560' },
        after: { bg1: '#e0f2f1', bg2: '#b2dfdb', accent: '#26a69a' },
        beforeTitle: emotion ? `${emotion}에 잠긴 고요` : '소리 없는 마음의 파도',
        afterTitle: '파도가 잔잔해지는 순간',
        beforeScene: '겉으로는 괜찮은 척, 안으로는 흔들리는 밤',
        afterScene: '자기 마음을 인정한 뒤 찾아온 평온',
      },
    ],
  };
  const variants = themeVariants[topic];
  return variants[variant % variants.length];
}

// ===== 공통 캐릭터 — 슬픈/웅크린 =====
function SadCharacter({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="85" rx="42" ry="7" fill="#000" opacity="0.1" />
      <ellipse cx="0" cy="40" rx="40" ry="38" fill="#e0cdb0" />
      <circle cx="0" cy="-10" r="33" fill="#f0dcc5" />
      <path d="M-23,-30 Q-10,-44 0,-38 Q10,-44 23,-30" stroke="#8b7355" strokeWidth="5" fill="none" />
      <path d="M-13,-13 Q-7,-9 -1,-13" stroke="#666" strokeWidth="2.5" fill="none" />
      <path d="M1,-13 Q7,-9 13,-13" stroke="#666" strokeWidth="2.5" fill="none" />
      <path d="M-7,2 Q0,6 7,2" stroke="#888" strokeWidth="2" fill="none" />
      <path d="M-35,10 Q-42,38 -12,50" stroke="#e0cdb0" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M35,10 Q42,38 12,50" stroke="#e0cdb0" strokeWidth="12" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ===== 공통 캐릭터 — 밝은/서 있는 =====
function HappyCharacter({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="90" rx="40" ry="7" fill="#388e3c" opacity="0.07" />
      <ellipse cx="0" cy="40" rx="40" ry="40" fill="#f5e6d3" />
      <circle cx="0" cy="-10" r="33" fill="#f5e6d3" />
      <path d="M-23,-30 Q-10,-46 0,-40 Q10,-46 23,-30" stroke="#8b7355" strokeWidth="5" fill="none" />
      <circle cx="-10" cy="-14" r="4" fill="#333" />
      <circle cx="10" cy="-14" r="4" fill="#333" />
      <circle cx="-8" cy="-15" r="1.5" fill="white" />
      <circle cx="12" cy="-15" r="1.5" fill="white" />
      <circle cx="-16" cy="-2" r="6" fill="#ffab91" opacity="0.4" />
      <circle cx="16" cy="-2" r="6" fill="#ffab91" opacity="0.4" />
      <path d="M-9,3 Q0,13 9,3" stroke="#555" strokeWidth="2" fill="none" />
    </g>
  );
}

// ===== 주제별 Before 씬 =====
function BeforeSceneContent({ topic }: { topic: SceneTopic }) {
  switch (topic) {
    case 'play':
      return (
        <g>
          <rect x="80" y="328" width="18" height="18" fill="#e74c3c" opacity="0.5" rx="2" />
          <rect x="105" y="332" width="14" height="14" fill="#3498db" opacity="0.4" rx="2" transform="rotate(15 112 339)" />
          <rect x="275" y="326" width="16" height="16" fill="#f39c12" opacity="0.4" rx="2" transform="rotate(-12 283 334)" />
          <g transform="translate(295, 318) rotate(40)">
            <circle cx="0" cy="0" r="10" fill="#d4a574" opacity="0.4" />
            <ellipse cx="0" cy="14" rx="8" ry="11" fill="#c0392b" opacity="0.3" />
          </g>
          <SadCharacter x={200} y={250} />
          <g transform="translate(125, 290)">
            <circle cx="0" cy="0" r="16" fill="#f5e6d3" />
            <circle cx="-4" cy="-3" r="2.5" fill="#333" />
            <circle cx="4" cy="-3" r="2.5" fill="#333" />
            <path d="M-3,4 Q0,7 3,4" stroke="#555" strokeWidth="1.5" fill="none" />
            <path d="M16,-4 L40,-12" stroke="#f5e6d3" strokeWidth="5" strokeLinecap="round">
              <animate attributeName="d" values="M16,-4 L40,-12;M16,-4 L42,-10;M16,-4 L40,-12" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'yelling':
      return (
        <g>
          <path d="M150,80 L168,145 L155,145 L173,210" stroke="#f1c40f" strokeWidth="3" fill="none" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.15;0.7;0.2" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M260,100 L274,155 L263,155 L278,205" stroke="#f1c40f" strokeWidth="2.5" fill="none" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.6;0.2" dur="1.8s" repeatCount="indefinite" />
          </path>
          {[0, 1, 2].map((i) => (
            <circle key={`w-${i}`} cx="200" cy="240" r={28 + i * 22} fill="none" stroke="#e74c3c" strokeWidth="1.5" opacity={0.25 - i * 0.06}>
              <animate attributeName="r" values={`${28 + i * 22};${36 + i * 22};${28 + i * 22}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <g transform="translate(200, 250)">
            <ellipse cx="0" cy="85" rx="42" ry="7" fill="#000" opacity="0.1" />
            <ellipse cx="0" cy="40" rx="40" ry="38" fill="#e0cdb0" />
            <circle cx="0" cy="-10" r="33" fill="#f0dcc5" />
            <path d="M-23,-30 Q-10,-44 0,-38 Q10,-44 23,-30" stroke="#8b7355" strokeWidth="5" fill="none" />
            <circle cx="-11" cy="-12" r="4" fill="#333" />
            <circle cx="11" cy="-12" r="4" fill="#333" />
            <ellipse cx="0" cy="5" rx="9" ry="7" fill="#c0392b" />
          </g>
        </g>
      );
    case 'tired':
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={`r-${i}`} transform={`translate(${158 + i * 38}, ${175 + i * 12})`}>
              <ellipse cx="0" cy="0" rx={20 - i * 2} ry={14 - i} fill={`rgba(100,100,120,${0.45 - i * 0.08})`} />
              <text x="0" y="4" textAnchor="middle" fontSize="9" fill="#888" opacity="0.5">{['피로', '걱정', '자책'][i]}</text>
            </g>
          ))}
          <SadCharacter x={200} y={255} />
          <text x="268" y="210" fontSize="17" fill="#7f8c8d" opacity="0.4"><animate attributeName="y" values="210;200;210" dur="3s" repeatCount="indefinite" />z</text>
          <text x="286" y="192" fontSize="21" fill="#7f8c8d" opacity="0.3"><animate attributeName="y" values="192;180;192" dur="3.5s" repeatCount="indefinite" />z</text>
          <text x="300" y="172" fontSize="25" fill="#7f8c8d" opacity="0.25"><animate attributeName="y" values="172;158;172" dur="4s" repeatCount="indefinite" />Z</text>
        </g>
      );
    case 'work':
      return (
        <g>
          <rect x="40" y="185" width="48" height="195" fill="#34495e" opacity="0.5" />
          <rect x="98" y="215" width="38" height="165" fill="#2c3e50" opacity="0.4" />
          {[0, 1, 2, 3].map((i) => (<rect key={`w-${i}`} x="50" y={205 + i * 38} width="9" height="7" fill="#f1c40f" opacity="0.25" rx="1" />))}
          <line x1="200" y1="155" x2="200" y2="385" stroke="#e74c3c" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.35" />
          <g transform="translate(140, 285)">
            <rect x="-14" y="8" width="28" height="45" rx="4" fill="#34495e" opacity="0.7" />
            <circle cx="0" cy="-10" r="20" fill="#f0dcc5" />
            <rect x="-8" y="-1" width="16" height="3" rx="1" fill="#e74c3c" opacity="0.4" />
            <path d="M-7,-14 Q-3,-10 1,-14" stroke="#666" strokeWidth="1.8" fill="none" />
            <path d="M1,-14 Q5,-10 9,-14" stroke="#666" strokeWidth="1.8" fill="none" />
          </g>
          <g transform="translate(280, 315)">
            <circle cx="0" cy="0" r="16" fill="#f5e6d3" />
            <circle cx="-4" cy="-3" r="2.5" fill="#333" />
            <circle cx="4" cy="-3" r="2.5" fill="#333" />
            <path d="M-3,4 Q0,1 3,4" stroke="#888" strokeWidth="1.5" fill="none" />
            <path d="M-16,4 L-40,0" stroke="#f5e6d3" strokeWidth="4" strokeLinecap="round">
              <animate attributeName="d" values="M-16,4 L-40,0;M-16,4 L-42,-2;M-16,4 L-40,0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'sleep':
      return (
        <g>
          <g transform="translate(300, 130)">
            <circle cx="0" cy="0" r="28" fill="none" stroke="#546e7a" strokeWidth="2" opacity="0.4" />
            <text x="0" y="5" textAnchor="middle" fontSize="13" fill="#e74c3c" opacity="0.6" fontFamily="monospace">3:42</text>
          </g>
          <rect x="85" y="305" width="230" height="75" rx="4" fill="#263238" opacity="0.25" />
          <g transform="translate(200, 295)">
            <ellipse cx="0" cy="35" rx="75" ry="25" fill="#455a64" opacity="0.3" />
            <circle cx="-28" cy="-5" r="23" fill="#f0dcc5" />
            <path d="M-40,-20 Q-28,-32 -16,-22" stroke="#8b7355" strokeWidth="3.5" fill="none" />
            <circle cx="-33" cy="-8" r="3" fill="#e74c3c" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="-23" cy="-8" r="3" fill="#e74c3c" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      );
    case 'food':
      return (
        <g>
          <ellipse cx="200" cy="318" rx="95" ry="22" fill="#8d6e63" opacity="0.35" />
          <g transform="translate(170, 288) rotate(-25)"><ellipse cx="0" cy="0" rx="20" ry="7" fill="#bdbdbd" opacity="0.5" /></g>
          {[0, 1, 2, 3].map((i) => (<circle key={`fd-${i}`} cx={150 + i * 24} cy={298 + (i % 3) * 7} r={3} fill={['#ff8a65', '#a5d6a7', '#fff176', '#ef9a9a'][i]} opacity="0.4" />))}
          <g transform="translate(200, 228)">
            <circle cx="0" cy="0" r="30" fill="#f0dcc5" />
            <path d="M-20,-16 Q-8,-28 0,-22 Q8,-28 20,-16" stroke="#8b7355" strokeWidth="4" fill="none" />
            <path d="M-10,-4 Q-5,0 0,-4" stroke="#666" strokeWidth="2" fill="none" />
            <path d="M0,-4 Q5,0 10,-4" stroke="#666" strokeWidth="2" fill="none" />
            <path d="M16,6 Q24,4 28,10" stroke="#999" strokeWidth="1.5" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="3s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'screen':
      return (
        <g>
          <rect x="135" y="185" width="130" height="85" rx="5" fill="#1a1a2e" stroke="#5dade2" strokeWidth="2" opacity="0.6" />
          <rect x="140" y="190" width="120" height="75" rx="3" fill="#5dade2" opacity="0.12">
            <animate attributeName="opacity" values="0.12;0.22;0.12" dur="3s" repeatCount="indefinite" />
          </rect>
          <g transform="translate(200, 305)">
            <circle cx="0" cy="0" r="18" fill="#f5e6d3" opacity="0.8" />
            <circle cx="-5" cy="-3" r="2.5" fill="#333" />
            <circle cx="5" cy="-3" r="2.5" fill="#333" />
          </g>
          <g transform="translate(85, 315)">
            <circle cx="0" cy="0" r="16" fill="#f0dcc5" opacity="0.5" />
            <path d="M-6,-3 Q-2,0 2,-3" stroke="#666" strokeWidth="1.5" fill="none" />
            <path d="M2,-3 Q6,0 10,-3" stroke="#666" strokeWidth="1.5" fill="none" />
          </g>
        </g>
      );
    case 'fighting':
      return (
        <g>
          <path d="M200,155 L196,205 L204,250 L198,300 L203,345" stroke="#e74c3c" strokeWidth="2" fill="none" opacity="0.35" strokeDasharray="4,3" />
          <g transform="translate(130, 275)">
            <ellipse cx="0" cy="70" rx="32" ry="5" fill="#000" opacity="0.08" />
            <ellipse cx="0" cy="32" rx="32" ry="32" fill="#e0cdb0" />
            <circle cx="0" cy="-10" r="28" fill="#f0dcc5" />
            <path d="M-18,-26 Q-8,-36 0,-30 Q8,-36 18,-26" stroke="#8b7355" strokeWidth="4" fill="none" />
            <circle cx="-8" cy="-12" r="3" fill="#333" />
            <path d="M-10,2 Q-5,-1 0,2" stroke="#888" strokeWidth="1.5" fill="none" />
          </g>
          <g transform="translate(270, 275)">
            <ellipse cx="0" cy="70" rx="32" ry="5" fill="#000" opacity="0.08" />
            <ellipse cx="0" cy="32" rx="32" ry="32" fill="#ddc5a0" />
            <circle cx="0" cy="-10" r="28" fill="#f0dcc5" />
            <path d="M-16,-26 Q-4,-38 4,-30 Q12,-38 20,-26" stroke="#6d4c41" strokeWidth="4" fill="none" />
            <circle cx="8" cy="-12" r="3" fill="#333" />
            <path d="M0,2 Q5,-1 10,2" stroke="#888" strokeWidth="1.5" fill="none" />
          </g>
          <g transform="translate(200, 225)">
            <path d="M-2,-8 C-7,-15 -15,-14 -15,-8 C-15,-2 -2,8 -2,8" fill="#e74c3c" opacity="0.35" />
            <path d="M2,-8 C7,-15 15,-14 15,-8 C15,-2 2,8 2,8" fill="#e74c3c" opacity="0.35" />
            <line x1="-2" y1="-10" x2="2" y2="8" stroke="#2e1a2e" strokeWidth="2" />
          </g>
        </g>
      );
    case 'lonely':
      return (
        <g>
          <SadCharacter x={200} y={270} scale={0.85} />
          {[85, 315, 105, 295].map((x, i) => (
            <circle key={`e-${i}`} cx={x} cy={205 + i * 28} r={4 + i} fill="#34495e" opacity={0.07 - i * 0.01}>
              <animate attributeName="opacity" values={`${0.07 - i * 0.01};0.02;${0.07 - i * 0.01}`} dur={`${4 + i}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      );
    default:
      return (
        <g>
          {[65, 135, 205, 275, 340].map((x, i) => (
            <line key={`rn-${i}`} x1={x} y1={145 + i * 4} x2={x - 4} y2={162 + i * 4} stroke="#5a7ea6" strokeWidth="1.5" opacity="0.4">
              <animate attributeName="y1" values={`${145 + i * 4};${295 + i * 3};${145 + i * 4}`} dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values={`${162 + i * 4};${312 + i * 3};${162 + i * 4}`} dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" />
            </line>
          ))}
          <ellipse cx="120" cy="108" rx="58" ry="28" fill="#4a5568" opacity="0.65">
            <animate attributeName="cx" values="120;133;120" dur="6s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="260" cy="95" rx="52" ry="26" fill="#4a5568" opacity="0.7">
            <animate attributeName="cx" values="260;273;260" dur="7s" repeatCount="indefinite" />
          </ellipse>
          <SadCharacter x={200} y={255} />
        </g>
      );
  }
}

// ===== 주제별 After 씬 =====
function AfterSceneContent({ topic }: { topic: SceneTopic }) {
  switch (topic) {
    case 'play':
      return (
        <g>
          <g transform="translate(82, 348)">
            <rect x="0" y="-14" width="12" height="12" fill="#e74c3c" rx="2" opacity="0.6" />
            <rect x="14" y="-14" width="12" height="12" fill="#3498db" rx="2" opacity="0.6" />
            <rect x="7" y="-25" width="12" height="12" fill="#f39c12" rx="2" opacity="0.6" />
          </g>
          <g transform="translate(200, 280)">
            <ellipse cx="0" cy="28" rx="105" ry="30" fill="#c8e6c9" opacity="0.4" />
            <circle cx="-42" cy="-10" r="26" fill="#f0dcc5" />
            <path d="M-56,-26 Q-42,-38 -28,-30" stroke="#8b7355" strokeWidth="4" fill="none" />
            <path d="M-50,-13 Q-46,-9 -42,-13" stroke="#666" strokeWidth="2" fill="none" />
            <path d="M-36,-13 Q-32,-9 -28,-13" stroke="#666" strokeWidth="2" fill="none" />
            <path d="M-47,0 Q-42,4 -37,0" stroke="#555" strokeWidth="1.5" fill="none" />
            <g transform="translate(0, -5)">
              <circle cx="0" cy="0" r="16" fill="#d4a574" />
              <circle cx="-8" cy="-10" r="5" fill="#c49a6c" />
              <circle cx="8" cy="-10" r="5" fill="#c49a6c" />
              <circle cx="-4" cy="-2" r="1.5" fill="#333" />
              <circle cx="4" cy="-2" r="1.5" fill="#333" />
              <ellipse cx="0" cy="3" rx="3" ry="2.5" fill="#8d6e63" />
            </g>
            <circle cx="42" cy="-5" r="20" fill="#f5e6d3" />
            <path d="M32,-18 Q42,-28 52,-20" stroke="#6d4c41" strokeWidth="3" fill="none" />
            <path d="M36,-7 Q40,-4 44,-7" stroke="#666" strokeWidth="1.5" fill="none" />
            <path d="M38,2 Q42,6 46,2" stroke="#555" strokeWidth="1.5" fill="none" />
          </g>
          <g transform="translate(200, 225)">
            <path d="M0,-7 C-4,-13 -11,-13 -11,-7 C-11,0 0,9 0,9 C0,9 11,0 11,-7 C11,-13 4,-13 0,-7Z" fill="#ef5350" opacity="0.55">
              <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'yelling':
      return (
        <g>
          {['#ef5350', '#ff9800', '#ffeb3b', '#66bb6a', '#42a5f5'].map((c, i) => (
            <path key={`rb-${i}`} d={`M65,${198 + i * 3} Q200,${108 + i * 2} 335,${198 + i * 3}`} fill="none" stroke={c} strokeWidth="3" opacity="0.15" />
          ))}
          <g transform="translate(200, 272)">
            <ellipse cx="0" cy="75" rx="45" ry="7" fill="#388e3c" opacity="0.06" />
            <ellipse cx="0" cy="32" rx="42" ry="40" fill="#f5e6d3" />
            <circle cx="0" cy="-14" r="30" fill="#f5e6d3" />
            <path d="M-20,-32 Q-8,-44 0,-38 Q8,-44 20,-32" stroke="#8b7355" strokeWidth="4.5" fill="none" />
            <circle cx="-9" cy="-18" r="3.5" fill="#333" />
            <circle cx="9" cy="-18" r="3.5" fill="#333" />
            <path d="M-7,-3 Q0,5 7,-3" stroke="#555" strokeWidth="2" fill="none" />
            <circle cx="0" cy="18" r="16" fill="#f5e6d3" />
            <path d="M-35,2 Q-42,20 -18,35" stroke="#f5e6d3" strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M35,2 Q42,20 18,35" stroke="#f5e6d3" strokeWidth="11" fill="none" strokeLinecap="round" />
          </g>
          {[0, 1, 2].map((i) => (
            <g key={`h-${i}`} transform={`translate(${162 + i * 38}, ${205 - i * 12})`}>
              <path d="M0,-3 C-2,-6 -5,-5 -5,-3 C-5,0 0,4 0,4 C0,4 5,0 5,-3 C5,-5 2,-6 0,-3Z" fill="#ef5350" opacity={0.35 - i * 0.08}>
                <animateTransform attributeName="transform" type="translate" values="0,0;0,-6;0,0" dur={`${3 + i}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}
        </g>
      );
    case 'tired':
      return (
        <g>
          {[95, 165, 245, 315].map((x, i) => (
            <g key={`fl-${i}`} transform={`translate(${x}, 365)`}>
              <line x1="0" y1="0" x2="0" y2="22" stroke="#66bb6a" strokeWidth="2" />
              <circle cx="0" cy="-4" r={5 + (i % 2)} fill={['#ef5350', '#ba68c8', '#ffa726', '#42a5f5'][i]}>
                <animate attributeName="r" values={`${5 + (i % 2)};${6.5 + (i % 2)};${5 + (i % 2)}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          <g transform="translate(125, 275)">
            <rect x="-10" y="0" width="20" height="24" rx="3" fill="#795548" opacity="0.6" />
            <path d="M-4,-8 Q-1,-18 2,-8" stroke="#bdbdbd" strokeWidth="1.5" fill="none" opacity="0.4">
              <animate attributeName="d" values="M-4,-8 Q-1,-18 2,-8;M-4,-12 Q-1,-22 2,-12;M-4,-8 Q-1,-18 2,-8" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
          <HappyCharacter x={230} y={248} />
          <path d="M195,258 Q177,230 173,205" stroke="#f5e6d3" strokeWidth="12" fill="none" strokeLinecap="round">
            <animate attributeName="d" values="M195,258 Q177,230 173,205;M195,258 Q175,225 170,198;M195,258 Q177,230 173,205" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M265,258 Q283,230 287,205" stroke="#f5e6d3" strokeWidth="12" fill="none" strokeLinecap="round">
            <animate attributeName="d" values="M265,258 Q283,230 287,205;M265,258 Q285,225 290,198;M265,258 Q283,230 287,205" dur="3s" repeatCount="indefinite" />
          </path>
        </g>
      );
    case 'work':
      return (
        <g>
          <g transform="translate(200, 205)">
            <rect x="-55" y="0" width="110" height="72" fill="#8d6e63" opacity="0.35" rx="3" />
            <polygon points="-65,0 0,-35 65,0" fill="#a1887f" opacity="0.35" />
            <rect x="-35" y="18" width="25" height="22" fill="#ffcc02" opacity="0.45" rx="2">
              <animate attributeName="opacity" values="0.45;0.65;0.45" dur="3s" repeatCount="indefinite" />
            </rect>
            <rect x="10" y="18" width="25" height="22" fill="#ffcc02" opacity="0.35" rx="2" />
            <rect x="-10" y="38" width="20" height="34" fill="#6d4c41" opacity="0.45" rx="2" />
          </g>
          <g transform="translate(200, 315)">
            <circle cx="-18" cy="0" r="20" fill="#f0dcc5" />
            <circle cx="-23" cy="-4" r="3" fill="#333" />
            <circle cx="-13" cy="-4" r="3" fill="#333" />
            <path d="M-23,5 Q-18,10 -13,5" stroke="#555" strokeWidth="1.8" fill="none" />
            <circle cx="18" cy="8" r="14" fill="#f5e6d3" />
            <circle cx="14" cy="5" r="2" fill="#333" />
            <circle cx="22" cy="5" r="2" fill="#333" />
            <path d="M15,12 Q18,15 21,12" stroke="#555" strokeWidth="1.5" fill="none" />
            <line x1="-3" y1="12" x2="7" y2="15" stroke="#f0dcc5" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g transform="translate(200, 290)">
            <path d="M0,-5 C-3,-9 -8,-9 -8,-5 C-8,-1 0,5 0,5 C0,5 8,-1 8,-5 C8,-9 3,-9 0,-5Z" fill="#ef5350" opacity="0.45">
              <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.8s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'sleep':
      return (
        <g>
          {[85, 155, 255, 325, 125, 285].map((x, i) => (
            <circle key={`st-${i}`} cx={x} cy={82 + (i % 3) * 28} r={1.5 + (i % 2)} fill="#fff9c4" opacity={0.45 + (i % 3) * 0.12}>
              <animate attributeName="opacity" values={`${0.45 + (i % 3) * 0.12};0.15;${0.45 + (i % 3) * 0.12}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <circle cx="310" cy="88" r="25" fill="#fff9c4" opacity="0.35" />
          <circle cx="317" cy="82" r="20" fill="#e8eaf6" />
          <g transform="translate(200, 295)">
            <ellipse cx="0" cy="30" rx="82" ry="18" fill="#c5cae9" opacity="0.25" />
            <ellipse cx="0" cy="18" rx="78" ry="26" fill="#7986cb" opacity="0.15" />
            <circle cx="-28" cy="-5" r="24" fill="#f0dcc5" />
            <path d="M-40,-20 Q-28,-32 -16,-22" stroke="#8b7355" strokeWidth="3.5" fill="none" />
            <path d="M-36,-8 Q-32,-5 -28,-8" stroke="#666" strokeWidth="1.8" fill="none" />
            <path d="M-20,-8 Q-16,-5 -12,-8" stroke="#666" strokeWidth="1.8" fill="none" />
            <path d="M-32,4 Q-28,7 -24,4" stroke="#555" strokeWidth="1.5" fill="none" />
            <circle cx="22" cy="0" r="18" fill="#f5e6d3" />
            <path d="M13,-12 Q22,-22 31,-14" stroke="#6d4c41" strokeWidth="2.5" fill="none" />
            <path d="M16,-2 Q20,1 24,-2" stroke="#666" strokeWidth="1.5" fill="none" />
            <path d="M18,5 Q22,8 26,5" stroke="#555" strokeWidth="1.5" fill="none" />
          </g>
          <text x="262" y="245" fontSize="13" fill="#7986cb" opacity="0.35"><animate attributeName="y" values="245;238;245" dur="3s" repeatCount="indefinite" />z</text>
          <text x="275" y="232" fontSize="16" fill="#7986cb" opacity="0.25"><animate attributeName="y" values="232;223;232" dur="3.5s" repeatCount="indefinite" />z</text>
        </g>
      );
    case 'food':
      return (
        <g>
          <ellipse cx="200" cy="315" rx="92" ry="22" fill="#a1887f" opacity="0.25" />
          <ellipse cx="162" cy="290" rx="18" ry="5" fill="#e0e0e0" opacity="0.5" />
          <ellipse cx="238" cy="290" rx="14" ry="4" fill="#e0e0e0" opacity="0.5" />
          <circle cx="162" cy="285" r="4" fill="#ff8a65" opacity="0.5" />
          <circle cx="238" cy="285" r="3" fill="#fff176" opacity="0.5" />
          <g transform="translate(162, 245)">
            <circle cx="0" cy="0" r="22" fill="#f0dcc5" />
            <circle cx="-6" cy="-4" r="3" fill="#333" />
            <circle cx="6" cy="-4" r="3" fill="#333" />
            <path d="M-6,5 Q0,10 6,5" stroke="#555" strokeWidth="1.8" fill="none" />
          </g>
          <g transform="translate(238, 255)">
            <circle cx="0" cy="0" r="16" fill="#f5e6d3" />
            <circle cx="-4" cy="-3" r="2.5" fill="#333" />
            <circle cx="4" cy="-3" r="2.5" fill="#333" />
            <path d="M-3,3 Q0,6 3,3" stroke="#555" strokeWidth="1.5" fill="none" />
            <line x1="16" y1="4" x2="24" y2="-4" stroke="#bdbdbd" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      );
    case 'screen':
      return (
        <g>
          <g transform="translate(82, 308)">
            <rect x="-5" y="0" width="10" height="28" fill="#795548" rx="2" />
            <circle cx="0" cy="-10" r="20" fill="#66bb6a" opacity="0.7" />
          </g>
          <g transform="translate(318, 312)">
            <rect x="-5" y="0" width="10" height="25" fill="#6d4c41" rx="2" />
            <circle cx="0" cy="-10" r="18" fill="#4caf50" opacity="0.7" />
          </g>
          <g transform="translate(200, 280)">
            <circle cx="-22" cy="-10" r="26" fill="#f0dcc5" />
            <path d="M-36,-26 Q-22,-38 -8,-30" stroke="#8b7355" strokeWidth="4" fill="none" />
            <circle cx="-27" cy="-14" r="3" fill="#333" />
            <circle cx="-17" cy="-14" r="3" fill="#333" />
            <path d="M-27,-2 Q-22,4 -17,-2" stroke="#555" strokeWidth="1.8" fill="none" />
            <circle cx="14" cy="0" r="18" fill="#f5e6d3" />
            <circle cx="10" cy="-3" r="2.5" fill="#333" />
            <circle cx="18" cy="-3" r="2.5" fill="#333" />
            <path d="M11,4 Q14,7 17,4" stroke="#555" strokeWidth="1.5" fill="none" />
            <g transform="translate(-4, 28)">
              <rect x="-16" y="0" width="32" height="22" rx="2" fill="#42a5f5" opacity="0.5" />
              <line x1="0" y1="2" x2="0" y2="20" stroke="white" strokeWidth="1" opacity="0.4" />
            </g>
          </g>
        </g>
      );
    case 'fighting':
      return (
        <g>
          <path d="M132,295 Q200,268 268,295" fill="none" stroke="#ec407a" strokeWidth="2.5" opacity="0.25" />
          <g transform="translate(142, 275)">
            <ellipse cx="0" cy="65" rx="28" ry="4" fill="#388e3c" opacity="0.05" />
            <ellipse cx="0" cy="28" rx="28" ry="28" fill="#f5e6d3" />
            <circle cx="0" cy="-10" r="24" fill="#f0dcc5" />
            <path d="M-16,-25 Q-5,-34 0,-28 Q5,-34 16,-25" stroke="#8b7355" strokeWidth="3.5" fill="none" />
            <circle cx="-7" cy="-14" r="3" fill="#333" />
            <circle cx="7" cy="-14" r="3" fill="#333" />
            <path d="M-6,0 Q0,6 6,0" stroke="#555" strokeWidth="1.8" fill="none" />
            <path d="M26,12 L50,18" stroke="#f0dcc5" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g transform="translate(258, 275)">
            <ellipse cx="0" cy="65" rx="28" ry="4" fill="#388e3c" opacity="0.05" />
            <ellipse cx="0" cy="28" rx="28" ry="28" fill="#f5e6d3" />
            <circle cx="0" cy="-10" r="24" fill="#f0dcc5" />
            <path d="M-14,-25 Q-3,-36 3,-28 Q10,-36 18,-25" stroke="#6d4c41" strokeWidth="3.5" fill="none" />
            <circle cx="-7" cy="-14" r="3" fill="#333" />
            <circle cx="7" cy="-14" r="3" fill="#333" />
            <path d="M-6,0 Q0,6 6,0" stroke="#555" strokeWidth="1.8" fill="none" />
            <path d="M-26,12 L-50,18" stroke="#f0dcc5" strokeWidth="7" strokeLinecap="round" />
          </g>
          <g transform="translate(200, 298)">
            <path d="M0,-12 C-4,-18 -9,-18 -9,-12 C-9,-6 0,-1 0,-1 C0,-1 9,-6 9,-12 C9,-18 4,-18 0,-12Z" fill="#ef5350" opacity="0.5">
              <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
    case 'lonely':
      return (
        <g>
          {[125, 200, 275].map((x, i) => (
            <g key={`p-${i}`} transform={`translate(${x}, 285)`}>
              <circle cx="0" cy="0" r={i === 1 ? 22 : 16} fill={i === 1 ? '#f0dcc5' : '#f5e6d3'} />
              <circle cx={-3} cy={-3} r={i === 1 ? 3 : 2.5} fill="#333" />
              <circle cx={3} cy={-3} r={i === 1 ? 3 : 2.5} fill="#333" />
              <path d={`M-${2 + i},${2 + i} Q0,${5 + i} ${2 + i},${2 + i}`} stroke="#555" strokeWidth={i === 1 ? 1.8 : 1.5} fill="none" />
            </g>
          ))}
          <line x1="141" y1="285" x2="178" y2="285" stroke="#26a69a" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
          <line x1="222" y1="285" x2="259" y2="285" stroke="#26a69a" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
          {[162, 240].map((x, i) => (
            <g key={`ch-${i}`} transform={`translate(${x}, 272)`}>
              <path d="M0,-3 C-2,-6 -5,-6 -5,-3 C-5,0 0,3 0,3 C0,3 5,0 5,-3 C5,-6 2,-6 0,-3Z" fill="#ef5350" opacity={0.35}>
                <animate attributeName="opacity" values="0.35;0.15;0.35" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}
          <circle cx="200" cy="285" r="55" fill="#26a69a" opacity="0.035">
            <animate attributeName="r" values="55;65;55" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      );
    default:
      return (
        <g>
          {[120, 200, 280].map((x, i) => (
            <g key={`df-${i}`} transform={`translate(${x}, 372)`}>
              <line x1="0" y1="0" x2="0" y2="16" stroke="#66bb6a" strokeWidth="2" />
              <circle cx="0" cy="-4" r="5" fill={['#ef5350', '#ffa726', '#ba68c8'][i]} />
            </g>
          ))}
          <g transform="translate(75, 325)">
            <rect x="-4" y="0" width="8" height="26" fill="#795548" rx="2" />
            <circle cx="0" cy="-8" r="18" fill="#66bb6a" />
          </g>
          <g transform="translate(335, 320)">
            <rect x="-5" y="0" width="10" height="30" fill="#6d4c41" rx="2" />
            <circle cx="0" cy="-12" r="22" fill="#4caf50" />
          </g>
          <HappyCharacter x={200} y={260} />
          <path d="M165,270 Q140,240 135,215" stroke="#f5e6d3" strokeWidth="12" fill="none" strokeLinecap="round">
            <animate attributeName="d" values="M165,270 Q140,240 135,215;M165,270 Q138,235 132,208;M165,270 Q140,240 135,215" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M235,270 Q260,240 265,215" stroke="#f5e6d3" strokeWidth="12" fill="none" strokeLinecap="round">
            <animate attributeName="d" values="M235,270 Q260,240 265,215;M235,270 Q262,235 268,208;M235,270 Q260,240 265,215" dur="3s" repeatCount="indefinite" />
          </path>
          <g transform="translate(200, 205)">
            <path d="M0,-7 C-4,-13 -12,-13 -12,-7 C-12,0 0,9 0,9 C0,9 12,0 12,-7 C12,-13 4,-13 0,-7Z" fill="#ef5350" opacity="0.6">
              <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="1.5s" repeatCount="indefinite" />
            </path>
          </g>
        </g>
      );
  }
}

// ===== 메인 컴포넌트 =====
export default function CounselingResultCards({ emotion, emotionEmoji, userContent, aiContent }: CounselingResultCardsProps) {
  const beforeSvgRef = useRef<SVGSVGElement>(null);
  const afterSvgRef = useRef<SVGSVGElement>(null);
  const [fullscreenType, setFullscreenType] = useState<'before' | 'after' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const topic = useMemo(() => detectTopic(userContent || ''), [userContent]);
  const variant = useMemo(() => getVariant(userContent || '' + (aiContent || ''), 4), [userContent, aiContent]);
  const theme = useMemo(() => getSceneTheme(topic, emotion, variant), [topic, emotion, variant]);

  const killingMessage = useMemo(() => {
    const ai = aiContent || '';
    const m = ai.match(/==([^=]+)==/);
    const msg = m ? m[1].trim() : '오늘의 마음도 내일의 당신을 만드는 중입니다';
    return msg.length > 30 ? msg.substring(0, 28) + '...' : msg;
  }, [aiContent]);

  const emoji = emotionEmoji || '😔';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">나의 상담 전 · 후</h3>
        <p className="text-xs sm:text-sm text-gray-500">숲의 상담사가 그린 당신의 마음 여정</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* 상담 전 */}
        <div className="flex flex-col items-center space-y-2">
          <div
            className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-gray-200 w-full cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setFullscreenType('before')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setFullscreenType('before')}
          >
            <svg ref={beforeSvgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="auto" className="block" style={{ pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="bgBefore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.before.bg1} />
                  <stop offset="100%" stopColor={theme.before.bg2} />
                </linearGradient>
              </defs>
              <rect width="400" height="520" fill="url(#bgBefore)" />
              {/* 변형별 배경 장식 */}
              {variant === 0 && (<>
                <circle cx="320" cy="70" r="28" fill="#555" opacity="0.14">
                  <animate attributeName="opacity" values="0.14;0.22;0.14" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="324" cy="65" r="22" fill="url(#bgBefore)" />
              </>)}
              {variant === 1 && (<>
                {/* 별이 빛나는 밤 */}
                {[{x:80,y:50},{x:150,y:90},{x:320,y:45},{x:350,y:110},{x:60,y:130},{x:250,y:70}].map((s,i) => (
                  <circle key={`bs-${i}`} cx={s.x} cy={s.y} r={1.5+i%2} fill="#fff" opacity={0.15+i*0.03}>
                    <animate attributeName="opacity" values={`${0.15+i*0.03};0.05;${0.15+i*0.03}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                <circle cx="330" cy="60" r="20" fill="#555" opacity="0.12" />
                <circle cx="334" cy="55" r="16" fill="url(#bgBefore)" />
              </>)}
              {variant === 2 && (<>
                {/* 비 내리는 배경 */}
                {[50,120,190,260,330].map((x,i) => (
                  <line key={`br-${i}`} x1={x} y1={60+i*8} x2={x-3} y2={78+i*8} stroke={theme.before.accent} strokeWidth="1" opacity="0.2">
                    <animate attributeName="y1" values={`${60+i*8};${340};${60+i*8}`} dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
                    <animate attributeName="y2" values={`${78+i*8};${358};${78+i*8}`} dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
                  </line>
                ))}
                <ellipse cx="140" cy="55" rx="50" ry="20" fill="#333" opacity="0.25" />
                <ellipse cx="280" cy="70" rx="45" ry="18" fill="#333" opacity="0.2" />
              </>)}
              {variant === 3 && (<>
                {/* 안개 낀 배경 */}
                <ellipse cx="100" cy="120" rx="80" ry="25" fill="#444" opacity="0.15">
                  <animate attributeName="cx" values="100;115;100" dur="7s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="300" cy="90" rx="70" ry="22" fill="#444" opacity="0.12">
                  <animate attributeName="cx" values="300;285;300" dur="8s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="200" cy="150" rx="90" ry="20" fill="#555" opacity="0.08">
                  <animate attributeName="cx" values="200;218;200" dur="9s" repeatCount="indefinite" />
                </ellipse>
              </>)}
              <BeforeSceneContent topic={topic} />
              <rect x="0" y="400" width="400" height="120" fill="#111827" opacity="0.6" />
              <text x="200" y="428" textAnchor="middle" fill="#d1d5db" fontFamily="sans-serif" fontSize="17" fontWeight="bold">상담 전</text>
              <text x="200" y="453" textAnchor="middle" fill={theme.before.accent} fontFamily="sans-serif" fontSize="13">{emoji} {theme.beforeTitle}</text>
              <text x="200" y="476" textAnchor="middle" fill="#9ca3af" fontFamily="sans-serif" fontSize="11" opacity="0.8">{theme.beforeScene}</text>
              <text x="200" y="505" textAnchor="middle" fill="#6b7280" fontFamily="sans-serif" fontSize="10" opacity="0.6">어른의 숲 | Forest of Calm</text>
            </svg>
            {/* 클릭 힌트 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
              <span className="opacity-0 hover:opacity-100 text-white text-xs bg-black/50 px-3 py-1 rounded-full transition-opacity pointer-events-none">
                클릭하여 확대
              </span>
            </div>
          </div>
          <button onClick={() => handleDownload('before')} className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors">📥 저장</button>
        </div>

        {/* 상담 후 */}
        <div className="flex flex-col items-center space-y-2">
          <div
            className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-green-200 w-full cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setFullscreenType('after')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setFullscreenType('after')}
          >
            <svg ref={afterSvgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="auto" className="block" style={{ pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="bgAfter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.after.bg1} />
                  <stop offset="40%" stopColor={theme.after.bg2} />
                  <stop offset="100%" stopColor={theme.after.accent} stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id="sunRay" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#fff9c4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="400" height="520" fill="url(#bgAfter)" />
              {/* 변형별 하늘 장식 */}
              {variant === 0 && (<>
                <circle cx="320" cy="70" r="50" fill="url(#sunRay)">
                  <animate attributeName="r" values="50;60;50" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="320" cy="70" r="24" fill="#fff9c4" opacity="0.6">
                  <animate attributeName="r" values="24;27;24" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <g opacity="0.65">
                  <ellipse cx="90" cy="85" rx="35" ry="16" fill="white">
                    <animate attributeName="cx" values="90;108;90" dur="8s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="118" cy="77" rx="25" ry="12" fill="white">
                    <animate attributeName="cx" values="118;136;118" dur="9s" repeatCount="indefinite" />
                  </ellipse>
                </g>
              </>)}
              {variant === 1 && (<>
                {/* 무지개 아치 + 나비 */}
                {['#ef5350','#ff9800','#ffeb3b','#66bb6a','#42a5f5','#ab47bc'].map((c,i) => (
                  <path key={`rb-${i}`} d={`M30,${155+i*4} Q200,${40+i*3} 370,${155+i*4}`} fill="none" stroke={c} strokeWidth="3" opacity="0.12" />
                ))}
                <g transform="translate(310,85)" opacity="0.5">
                  <path d="M0,0 C-8,-12 -18,-8 -10,0 C-18,8 -8,12 0,0" fill={theme.after.accent} />
                  <path d="M0,0 C8,-12 18,-8 10,0 C18,8 8,12 0,0" fill={theme.after.accent} opacity="0.7" />
                  <animateTransform attributeName="transform" type="translate" values="310,85;315,80;310,85" dur="3s" repeatCount="indefinite" />
                </g>
                <g transform="translate(90,100)" opacity="0.35">
                  <path d="M0,0 C-6,-9 -14,-6 -7,0 C-14,6 -6,9 0,0" fill="#ffb74d" />
                  <path d="M0,0 C6,-9 14,-6 7,0 C14,6 6,9 0,0" fill="#ffb74d" opacity="0.7" />
                  <animateTransform attributeName="transform" type="translate" values="90,100;95,95;90,100" dur="4s" repeatCount="indefinite" />
                </g>
              </>)}
              {variant === 2 && (<>
                {/* 석양 느낌 + 새 */}
                <circle cx="200" cy="60" r="40" fill="#fff9c4" opacity="0.4">
                  <animate attributeName="r" values="40;48;40" dur="5s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="60" r="65" fill="#fff9c4" opacity="0.1" />
                {/* 새 무리 */}
                {[{x:100,y:80},{x:130,y:65},{x:160,y:75},{x:280,y:90},{x:310,y:78}].map((b,i) => (
                  <path key={`bd-${i}`} d={`M${b.x},${b.y} Q${b.x-5},${b.y-5} ${b.x-10},${b.y} M${b.x},${b.y} Q${b.x+5},${b.y-5} ${b.x+10},${b.y}`} stroke="#666" strokeWidth="1.2" fill="none" opacity="0.25">
                    <animate attributeName="opacity" values="0.25;0.15;0.25" dur={`${3+i*0.3}s`} repeatCount="indefinite" />
                  </path>
                ))}
              </>)}
              {variant === 3 && (<>
                {/* 꽃잎 흩날리는 배경 */}
                {[{x:80,y:60},{x:160,y:45},{x:280,y:70},{x:340,y:55},{x:120,y:100},{x:240,y:90}].map((p,i) => (
                  <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={3+i%2} fill={['#f48fb1','#ce93d8','#ffab91','#80cbc4','#fff176','#a5d6a7'][i]} opacity={0.3+i*0.03}>
                    <animate attributeName="cy" values={`${p.y};${p.y+15};${p.y}`} dur={`${3+i*0.5}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${p.x};${p.x+8};${p.x}`} dur={`${4+i*0.3}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                <circle cx="320" cy="65" r="30" fill="#fff9c4" opacity="0.25">
                  <animate attributeName="r" values="30;36;30" dur="4s" repeatCount="indefinite" />
                </circle>
              </>)}
              <AfterSceneContent topic={topic} />
              <rect x="0" y="400" width="400" height="120" fill="#1b5e20" opacity="0.12" />
              <text x="200" y="428" textAnchor="middle" fill="#2e7d32" fontFamily="sans-serif" fontSize="17" fontWeight="bold">상담 후</text>
              <text x="200" y="453" textAnchor="middle" fill={theme.after.accent} fontFamily="sans-serif" fontSize="13">🌿 {theme.afterTitle}</text>
              <text x="200" y="476" textAnchor="middle" fill="#66bb6a" fontFamily="sans-serif" fontSize="11" opacity="0.8">{theme.afterScene}</text>
              <text x="200" y="505" textAnchor="middle" fill="#81c784" fontFamily="sans-serif" fontSize="10" opacity="0.6">어른의 숲 | Forest of Calm</text>
            </svg>
            {/* 클릭 힌트 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
              <span className="opacity-0 hover:opacity-100 text-white text-xs bg-black/50 px-3 py-1 rounded-full transition-opacity pointer-events-none">
                클릭하여 확대
              </span>
            </div>
          </div>
          <button onClick={() => handleDownload('after')} className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors">📥 저장</button>
        </div>
      </div>

      {killingMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-sm sm:text-base font-medium text-green-800 italic">
            &ldquo;{killingMessage}&rdquo;
          </p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={async () => { await handleDownload('before'); setTimeout(() => handleDownload('after'), 500); }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
        >
          📥 전체 저장하기
        </button>
      </div>

      {/* 전체 화면 모달 — Portal로 body에 직접 렌더 (CSS stacking context 이슈 방지) */}
      {mounted && fullscreenType && createPortal(
        <div
          className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setFullscreenType(null)}
        >
          {/* 닫기 버튼 */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10 w-10 h-10 flex items-center justify-center"
            onClick={() => setFullscreenType(null)}
          >
            ✕
          </button>

          {/* 전/후 전환 탭 */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                fullscreenType === 'before'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              onClick={(e) => { e.stopPropagation(); setFullscreenType('before'); }}
            >
              상담 전
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                fullscreenType === 'after'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              onClick={(e) => { e.stopPropagation(); setFullscreenType('after'); }}
            >
              상담 후
            </button>
          </div>

          {/* 확대된 SVG 이미지 */}
          <div
            className="max-w-[90vw] max-h-[75vh] overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" className="w-full h-full block">
              <defs>
                <linearGradient id="bgFullBefore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.before.bg1} />
                  <stop offset="100%" stopColor={theme.before.bg2} />
                </linearGradient>
                <linearGradient id="bgFullAfter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.after.bg1} />
                  <stop offset="40%" stopColor={theme.after.bg2} />
                  <stop offset="100%" stopColor={theme.after.accent} stopOpacity="0.3" />
                </linearGradient>
                <radialGradient id="sunRayFull" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#fff9c4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {fullscreenType === 'before' ? (
                <>
                  <rect width="400" height="520" fill="url(#bgFullBefore)" />
                  {variant === 0 && (<>
                    <circle cx="320" cy="70" r="28" fill="#555" opacity="0.14">
                      <animate attributeName="opacity" values="0.14;0.22;0.14" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="324" cy="65" r="22" fill="url(#bgFullBefore)" />
                  </>)}
                  {variant === 1 && (<>
                    {[{x:80,y:50},{x:150,y:90},{x:320,y:45},{x:350,y:110},{x:60,y:130},{x:250,y:70}].map((s,i) => (
                      <circle key={`fbs-${i}`} cx={s.x} cy={s.y} r={1.5+i%2} fill="#fff" opacity={0.15+i*0.03}>
                        <animate attributeName="opacity" values={`${0.15+i*0.03};0.05;${0.15+i*0.03}`} dur={`${2+i*0.5}s`} repeatCount="indefinite" />
                      </circle>
                    ))}
                    <circle cx="330" cy="60" r="20" fill="#555" opacity="0.12" />
                    <circle cx="334" cy="55" r="16" fill="url(#bgFullBefore)" />
                  </>)}
                  {variant === 2 && (<>
                    {[50,120,190,260,330].map((x,i) => (
                      <line key={`fbr-${i}`} x1={x} y1={60+i*8} x2={x-3} y2={78+i*8} stroke={theme.before.accent} strokeWidth="1" opacity="0.2">
                        <animate attributeName="y1" values={`${60+i*8};${340};${60+i*8}`} dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="y2" values={`${78+i*8};${358};${78+i*8}`} dur={`${1.5+i*0.2}s`} repeatCount="indefinite" />
                      </line>
                    ))}
                    <ellipse cx="140" cy="55" rx="50" ry="20" fill="#333" opacity="0.25" />
                    <ellipse cx="280" cy="70" rx="45" ry="18" fill="#333" opacity="0.2" />
                  </>)}
                  {variant === 3 && (<>
                    <ellipse cx="100" cy="120" rx="80" ry="25" fill="#444" opacity="0.15">
                      <animate attributeName="cx" values="100;115;100" dur="7s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="300" cy="90" rx="70" ry="22" fill="#444" opacity="0.12">
                      <animate attributeName="cx" values="300;285;300" dur="8s" repeatCount="indefinite" />
                    </ellipse>
                    <ellipse cx="200" cy="150" rx="90" ry="20" fill="#555" opacity="0.08">
                      <animate attributeName="cx" values="200;218;200" dur="9s" repeatCount="indefinite" />
                    </ellipse>
                  </>)}
                  <BeforeSceneContent topic={topic} />
                  <rect x="0" y="400" width="400" height="120" fill="#111827" opacity="0.6" />
                  <text x="200" y="428" textAnchor="middle" fill="#d1d5db" fontFamily="sans-serif" fontSize="17" fontWeight="bold">상담 전</text>
                  <text x="200" y="453" textAnchor="middle" fill={theme.before.accent} fontFamily="sans-serif" fontSize="13">{emoji} {theme.beforeTitle}</text>
                  <text x="200" y="476" textAnchor="middle" fill="#9ca3af" fontFamily="sans-serif" fontSize="11" opacity="0.8">{theme.beforeScene}</text>
                  <text x="200" y="505" textAnchor="middle" fill="#6b7280" fontFamily="sans-serif" fontSize="10" opacity="0.6">어른의 숲 | Forest of Calm</text>
                </>
              ) : (
                <>
                  <rect width="400" height="520" fill="url(#bgFullAfter)" />
                  {variant === 0 && (<>
                    <circle cx="320" cy="70" r="50" fill="url(#sunRayFull)">
                      <animate attributeName="r" values="50;60;50" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="320" cy="70" r="24" fill="#fff9c4" opacity="0.6">
                      <animate attributeName="r" values="24;27;24" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <g opacity="0.65">
                      <ellipse cx="90" cy="85" rx="35" ry="16" fill="white">
                        <animate attributeName="cx" values="90;108;90" dur="8s" repeatCount="indefinite" />
                      </ellipse>
                      <ellipse cx="118" cy="77" rx="25" ry="12" fill="white">
                        <animate attributeName="cx" values="118;136;118" dur="9s" repeatCount="indefinite" />
                      </ellipse>
                    </g>
                  </>)}
                  {variant === 1 && (<>
                    {['#ef5350','#ff9800','#ffeb3b','#66bb6a','#42a5f5','#ab47bc'].map((c,i) => (
                      <path key={`frb-${i}`} d={`M30,${155+i*4} Q200,${40+i*3} 370,${155+i*4}`} fill="none" stroke={c} strokeWidth="3" opacity="0.12" />
                    ))}
                  </>)}
                  {variant === 2 && (<>
                    <circle cx="200" cy="60" r="40" fill="#fff9c4" opacity="0.4">
                      <animate attributeName="r" values="40;48;40" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="60" r="65" fill="#fff9c4" opacity="0.1" />
                    {[{x:100,y:80},{x:130,y:65},{x:160,y:75},{x:280,y:90},{x:310,y:78}].map((b,i) => (
                      <path key={`fbd-${i}`} d={`M${b.x},${b.y} Q${b.x-5},${b.y-5} ${b.x-10},${b.y} M${b.x},${b.y} Q${b.x+5},${b.y-5} ${b.x+10},${b.y}`} stroke="#666" strokeWidth="1.2" fill="none" opacity="0.25" />
                    ))}
                  </>)}
                  {variant === 3 && (<>
                    {[{x:80,y:60},{x:160,y:45},{x:280,y:70},{x:340,y:55},{x:120,y:100},{x:240,y:90}].map((p,i) => (
                      <circle key={`fpt-${i}`} cx={p.x} cy={p.y} r={3+i%2} fill={['#f48fb1','#ce93d8','#ffab91','#80cbc4','#fff176','#a5d6a7'][i]} opacity={0.3+i*0.03}>
                        <animate attributeName="cy" values={`${p.y};${p.y+15};${p.y}`} dur={`${3+i*0.5}s`} repeatCount="indefinite" />
                        <animate attributeName="cx" values={`${p.x};${p.x+8};${p.x}`} dur={`${4+i*0.3}s`} repeatCount="indefinite" />
                      </circle>
                    ))}
                    <circle cx="320" cy="65" r="30" fill="#fff9c4" opacity="0.25">
                      <animate attributeName="r" values="30;36;30" dur="4s" repeatCount="indefinite" />
                    </circle>
                  </>)}
                  <AfterSceneContent topic={topic} />
                  <rect x="0" y="400" width="400" height="120" fill="#1b5e20" opacity="0.12" />
                  <text x="200" y="428" textAnchor="middle" fill="#2e7d32" fontFamily="sans-serif" fontSize="17" fontWeight="bold">상담 후</text>
                  <text x="200" y="453" textAnchor="middle" fill={theme.after.accent} fontFamily="sans-serif" fontSize="13">🌿 {theme.afterTitle}</text>
                  <text x="200" y="476" textAnchor="middle" fill="#66bb6a" fontFamily="sans-serif" fontSize="11" opacity="0.8">{theme.afterScene}</text>
                  <text x="200" y="505" textAnchor="middle" fill="#81c784" fontFamily="sans-serif" fontSize="10" opacity="0.6">어른의 숲 | Forest of Calm</text>
                </>
              )}
            </svg>
          </div>

          {/* 하단 저장 버튼 */}
          <button
            className="mt-4 bg-white/15 hover:bg-white/25 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
            onClick={(e) => { e.stopPropagation(); handleDownload(fullscreenType); }}
          >
            📥 이미지 저장
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
