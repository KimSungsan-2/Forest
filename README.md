# 🌲 어른의 숲 (Forest of Calm)

부모의 자책감을 성장의 데이터로 바꾸는 AI 감정 회고 PWA 플랫폼

## 프로젝트 구조

```
forest-of-calm/
├── apps/
│   └── web/                  # Next.js PWA 프론트엔드
├── backend/                  # Fastify 백엔드 API
├── shared/                   # 공유 타입 및 유틸리티
└── package.json             # Monorepo 루트
```

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: @ducanh2912/next-pwa
- **State Management**: Zustand (예정)

### Backend
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis
- **AI**: Anthropic Claude API
- **Authentication**: JWT (@fastify/jwt)

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 14+
- Redis (선택사항)
- Anthropic API Key

### 1. 환경 변수 설정

#### Backend 환경 변수

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열고 다음 값들을 설정하세요:

```env
# Database - Supabase 또는 로컬 PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/forest_of_calm?schema=public"

# JWT Secret - 랜덤 문자열 생성 권장
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Anthropic API Key
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxx"

# Redis (선택사항)
REDIS_URL="redis://localhost:6379"
```

### 2. 의존성 설치

```bash
# 루트에서 모든 패키지 설치
npm install

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd apps/web
npm install

# PWA 패키지 설치
npm install @ducanh2912/next-pwa --save-dev
```

### 3. 데이터베이스 설정

```bash
cd backend

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# Prisma Studio 실행 (선택사항)
npm run prisma:studio
```

### 4. 개발 서버 실행

#### 전체 실행 (프론트엔드 + 백엔드)

```bash
# 루트 디렉토리에서
npm run dev
```

#### 개별 실행

```bash
# 백엔드만
cd backend
npm run dev

# 프론트엔드만
cd apps/web
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## MVP 기능

### Phase 1: 기본 인프라 ✅
- [x] Next.js + Fastify 프로젝트 구조
- [x] Prisma 스키마 작성
- [x] JWT 기반 인증 (회원가입/로그인)
- [x] PWA 기본 설정

### Phase 2: AI 벤팅 ✅
- [x] Claude API 통합
- [x] 인지 재구조화 프롬프트
- [x] 채팅 인터페이스 UI
- [x] 회고 저장 기능
- [x] 로그인/회원가입 페이지
- [x] 대시보드
- [x] 벤팅 페이지 (감정 선택 + 작성 + AI 응답)
- [x] 개별 회고 상세 페이지 (멀티턴 대화)

### Phase 3: 음성 입력
- [ ] Web Speech API 통합
- [ ] STT 변환
- [ ] 음성 UI 컴포넌트

### Phase 4: 회고 히스토리 ✅
- [x] 타임라인 뷰
- [x] 전체 텍스트 검색
- [x] 필터링 기능 (감정 태그별)

### Phase 5: 마음 날씨 지수
- [ ] 감정 분석 엔진
- [ ] 번아웃 감지 알고리즘
- [ ] 대시보드 및 차트

### Phase 6: PWA 고도화
- [ ] 오프라인 지원
- [ ] 백그라운드 동기화
- [ ] 푸시 알림

### Phase 7: 최적화
- [ ] Lighthouse PWA 90+ 점수
- [ ] 보안 감사
- [ ] 성능 최적화

## API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 회고
- `POST /api/reflections` - 회고 생성 (AI 자동 응답 포함)
- `GET /api/reflections` - 회고 목록 (페이지네이션, 검색, 필터)
- `GET /api/reflections/:id` - 회고 상세 (대화 히스토리 포함)
- `DELETE /api/reflections/:id` - 회고 삭제

### AI 대화
- `POST /api/chat/send` - 메시지 전송 (비스트리밍)
- `POST /api/chat/stream` - 메시지 전송 (SSE 스트리밍)

### 분석 (예정)
- `GET /api/analytics/mind-weather` - 마음 날씨 지수
- `GET /api/analytics/trends` - 감정 트렌드
- `POST /api/analytics/calculate` - 지수 재계산

## 데이터베이스 스키마

```prisma
model User {
  id                    String
  email                 String @unique
  passwordHash          String
  displayName           String?
  subscriptionTier      String @default("free")
  reflections           Reflection[]
  mindWeatherScores     MindWeatherScore[]
}

model Reflection {
  id                String
  userId            String
  content           String
  emotionalTone     String?
  sentimentScore    Float?
  conversations     Conversation[]
}

model Conversation {
  id                String
  reflectionId      String
  role              String  // "user" | "assistant"
  content           String
  aiModel           String?
}

model MindWeatherScore {
  id                String
  userId            String
  overallScore      Float
  burnoutRisk       String
  recommendations   Json
}
```

## 보안

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해싱 (12 rounds)
- Helmet.js 보안 헤더
- Rate limiting (100 req/hour)
- CORS 설정
- Prisma로 SQL Injection 방지

## 배포 (예정)

- **Frontend**: Vercel
- **Backend**: Railway.app
- **Database**: Supabase PostgreSQL
- **Redis**: Upstash

## 라이선스

Private - All Rights Reserved

## 개발자

성산 (Sungsan)

---

**문의사항**이 있으시면 이슈를 등록해주세요.
