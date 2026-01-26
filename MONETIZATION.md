# 어른의 숲 (Forest of Calm) - 수익화 전략

## 현재 상황
- ✅ 핵심 기능 완성 (AI 회고, 음성 입력, 마음 날씨 지수)
- ✅ 게스트 모드 (무료 체험)
- ✅ 회원 시스템 (JWT 인증)
- ⏳ 구독 시스템 준비됨 (Prisma 스키마에 `subscriptionTier` 포함)

---

## 🎯 추천 수익화 전략

### 1. **프리미엄 (Freemium) 모델** ⭐ 최우선 추천

**무료 플랜 (Free)**
- 월 10회 AI 회고 제한
- 기본 감정 분석
- 7일간 히스토리 조회
- 광고 표시

**프리미엄 플랜 (Premium) - ₩9,900/월**
- ✅ 무제한 AI 회고
- ✅ 고급 마음 날씨 지수 (30일 트렌드)
- ✅ 음성 입력 무제한
- ✅ 광고 제거
- ✅ 회고 데이터 PDF/CSV 내보내기
- ✅ 주간/월간 리포트 이메일 발송
- ✅ 우선 지원

**패밀리 플랜 (Family) - ₩14,900/월**
- 프리미엄 기능 모두 포함
- 최대 2명 계정 (부모 공동 사용)
- 부부 감정 동기화 대시보드
- 가족 목표 설정 및 추적

#### 구현 방법:
```typescript
// backend/src/middleware/subscription.ts
export function requirePremium(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtPayload;

  if (user.subscriptionTier === 'free') {
    return reply.status(402).send({
      error: '프리미엄 전용 기능입니다',
      upgradeUrl: '/pricing'
    });
  }
}
```

**예상 수익 (1,000명 가입 기준)**
- 전환율 10% → 100명 × ₩9,900 = **₩990,000/월**
- 전환율 20% → 200명 × ₩9,900 = **₩1,980,000/월**

---

### 2. **결제 시스템 통합**

#### 추천 결제 게이트웨이
1. **Toss Payments** (토스페이먼츠)
   - 한국 시장 최적화
   - 간편결제 (카카오페이, 네이버페이)
   - 월 정기 결제 (구독) 지원
   - 수수료: 2.9% + VAT

2. **Stripe** (글로벌 확장 시)
   - 글로벌 결제 지원
   - 구독 관리 자동화
   - 수수료: 3.4% + ₩50

#### 구현 예시 (Toss Payments):
```typescript
// apps/web/app/(app)/pricing/page.tsx
async function handleSubscribe(plan: 'premium' | 'family') {
  const response = await fetch('/api/payments/subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan })
  });

  const { paymentUrl } = await response.json();
  window.location.href = paymentUrl; // 토스 결제 페이지로 이동
}
```

```typescript
// backend/src/modules/payments/toss.service.ts
export class TossPaymentService {
  async createSubscription(userId: string, plan: string) {
    const amount = plan === 'premium' ? 9900 : 14900;

    const response = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerKey: userId,
        amount,
        orderId: generateOrderId(),
        orderName: `어른의 숲 ${plan} 플랜`,
        successUrl: `${FRONTEND_URL}/payment/success`,
        failUrl: `${FRONTEND_URL}/payment/fail`
      })
    });

    return response.json();
  }
}
```

---

### 3. **추가 수익원**

#### A. **B2B (기업/기관 판매)** 💼
**타겟**: 육아휴직 직원 지원, 직장맘 복지 프로그램
- 대기업 HR 부서
- 육아 관련 NGO/비영리단체
- 직장맘 커뮤니티

**가격**: ₩5,000/인/월 (최소 50명)
- 예: 100명 × ₩5,000 = **₩500,000/월/기업**

**추가 기능**:
- 익명화된 집단 분석 리포트
- HR 담당자 대시보드
- 맞춤형 교육 콘텐츠 제공

#### B. **광고 수익** 📺
**무료 사용자 대상**
- Google AdSense 통합
- 육아 관련 제품/서비스 광고
- 월 1,000 무료 사용자 기준: **₩100,000~300,000/월**

```typescript
// apps/web/app/(app)/layout.tsx
{user.subscriptionTier === 'free' && (
  <div className="mt-4 border-t pt-4">
    <GoogleAd slot="1234567890" />
  </div>
)}
```

#### C. **파트너십/제휴** 🤝
- 육아 용품 브랜드 (기저귀, 분유 등)
- 심리 상담 서비스 (번아웃 고위험군 연계)
- 도서 출판사 (육아서적)
- 제휴 수수료: 거래당 5-10%

#### D. **데이터 판매** (익명화) 📊
- 육아 트렌드 리포트 (익명화된 집계 데이터)
- 학술 연구 기관 제공
- **주의**: GDPR/개인정보보호법 준수 필수

---

### 4. **구독 관리 시스템 구현**

#### Prisma 스키마 업데이트:
```prisma
model Subscription {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  user      User     @relation(fields: [userId], references: [id])

  plan      String   // "free" | "premium" | "family"
  status    String   // "active" | "canceled" | "past_due"

  currentPeriodStart DateTime @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")

  paymentMethod String? @map("payment_method") // "card" | "kakao" | "naver"
  billingKey    String? @map("billing_key") // 토스 자동결제 키

  canceledAt    DateTime? @map("canceled_at")
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("subscriptions")
}

model Payment {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")

  amount      Int
  plan        String
  status      String   // "pending" | "completed" | "failed"

  paymentKey  String?  @map("payment_key") // 토스 결제 키
  orderId     String   @unique @map("order_id")

  paidAt      DateTime? @map("paid_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("payments")
}
```

#### 구독 체크 미들웨어:
```typescript
// backend/src/middleware/subscription.ts
export async function checkReflectionLimit(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtPayload;

  if (user.subscriptionTier === 'free') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.reflection.count({
      where: {
        userId: user.userId,
        createdAt: { gte: today }
      }
    });

    if (count >= 10) {
      return reply.status(402).send({
        error: '무료 플랜은 월 10회까지 사용 가능합니다',
        currentUsage: count,
        limit: 10,
        upgradeUrl: '/pricing'
      });
    }
  }
}
```

---

### 5. **가격 페이지 UI**

```typescript
// apps/web/app/(app)/pricing/page.tsx
export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">요금제 선택</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 무료 플랜 */}
        <div className="border rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">무료</h3>
          <div className="text-4xl font-bold mb-6">₩0<span className="text-lg">/월</span></div>
          <ul className="space-y-3 mb-8">
            <li>✅ 월 10회 AI 회고</li>
            <li>✅ 기본 감정 분석</li>
            <li>✅ 7일 히스토리</li>
            <li>⚠️ 광고 포함</li>
          </ul>
          <button className="w-full bg-gray-200 py-3 rounded-lg">현재 플랜</button>
        </div>

        {/* 프리미엄 플랜 */}
        <div className="border-4 border-green-500 rounded-xl p-8 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm">
            인기
          </div>
          <h3 className="text-2xl font-bold mb-4">프리미엄</h3>
          <div className="text-4xl font-bold mb-6">₩9,900<span className="text-lg">/월</span></div>
          <ul className="space-y-3 mb-8">
            <li>✅ 무제한 AI 회고</li>
            <li>✅ 고급 마음 날씨 지수</li>
            <li>✅ 음성 입력 무제한</li>
            <li>✅ 광고 제거</li>
            <li>✅ 데이터 내보내기</li>
            <li>✅ 주간 리포트</li>
          </ul>
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
            업그레이드
          </button>
        </div>

        {/* 패밀리 플랜 */}
        <div className="border rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">패밀리</h3>
          <div className="text-4xl font-bold mb-6">₩14,900<span className="text-lg">/월</span></div>
          <ul className="space-y-3 mb-8">
            <li>✅ 프리미엄 모든 기능</li>
            <li>✅ 2개 계정 (부부 공동)</li>
            <li>✅ 부부 동기화 대시보드</li>
            <li>✅ 가족 목표 추적</li>
          </ul>
          <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
            업그레이드
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. **성장 전략**

#### 초기 (0-1,000명)
1. **무료 체험 강화**
   - 가입 시 프리미엄 7일 무료 체험
   - 친구 초대 시 양쪽 모두 1개월 프리미엄

2. **콘텐츠 마케팅**
   - 블로그: "육아 번아웃 자가진단", "감정 일기의 과학적 효과"
   - 인스타그램: 부모 공감 콘텐츠
   - 유튜브: 전문가 인터뷰

3. **커뮤니티 구축**
   - 베타 테스터 그룹 (디스코드/슬랙)
   - 사용자 피드백 적극 반영

#### 중기 (1,000-10,000명)
1. **B2B 진출**
   - 기업 HR 부서 직접 영업
   - 육아 관련 컨퍼런스 참여

2. **파트너십**
   - 산후조리원 제휴
   - 어린이집/유치원 부모 대상

3. **앱 출시**
   - Capacitor로 네이티브 앱 래핑
   - 앱스토어 ASO 최적화

#### 장기 (10,000명+)
1. **AI 고도화**
   - GPT-4 업그레이드 (더 정교한 공감)
   - 음성 분석 (목소리 톤에서 감정 감지)

2. **글로벌 진출**
   - 영어/일본어 번역
   - 해외 부모 커뮤니티 타겟

3. **오프라인 연계**
   - 전문 상담사 매칭 서비스
   - 부모 워크샵 개최

---

## 📊 예상 재무 시나리오

### 보수적 시나리오 (1년 후)
- 총 사용자: 2,000명
- 유료 전환율: 10% (200명)
- 월 매출: 200명 × ₩9,900 = **₩1,980,000**
- 연 매출: **₩23,760,000**

### 낙관적 시나리오 (1년 후)
- 총 사용자: 5,000명
- 유료 전환율: 15% (750명)
- 월 매출: 750명 × ₩9,900 = **₩7,425,000**
- 연 매출: **₩89,100,000**

### 비용 구조 (월간)
- Claude API: ₩200,000 (500명 활성 사용자 기준)
- Supabase/인프라: ₩100,000
- 결제 수수료 (3%): ₩60,000~220,000
- **총 비용**: ₩360,000~520,000
- **순이익**: ₩1,620,000~6,905,000

---

## 🚀 구현 우선순위

### Phase 1: 결제 시스템 (2주)
1. Toss Payments 통합
2. 구독 관리 테이블 생성
3. 가격 페이지 UI
4. 구독 상태 체크 미들웨어

### Phase 2: 프리미엄 기능 (1주)
1. 무료 플랜 사용량 제한 (10회/월)
2. 프리미엄 전용 기능 잠금
3. 업그레이드 유도 UI

### Phase 3: 성장 기능 (2주)
1. 이메일 알림 (주간 리포트)
2. 데이터 내보내기 (PDF/CSV)
3. 친구 초대 시스템

### Phase 4: B2B (1개월)
1. 기업용 대시보드
2. 다중 계정 관리
3. 집단 분석 리포트

---

## 💡 핵심 성공 요소

1. **무료→유료 전환 최적화**
   - "마음 날씨 지수"를 프리미엄 전용으로 (가장 매력적인 기능)
   - 무료 사용자에게 샘플 리포트 미리보기 제공

2. **이탈 방지**
   - 구독 취소 시 피드백 수집
   - 할인 쿠폰 제공 (재가입 유도)

3. **바이럴 성장**
   - 친구 초대 시 양쪽 모두 혜택
   - 소셜 공유 기능 (익명화된 인사이트)

4. **신뢰 구축**
   - 개인정보 보호 강조
   - 전문가 추천/인증

---

## 🎯 다음 단계

**즉시 착수 가능**:
1. `/pricing` 페이지 제작
2. Toss Payments 계정 개설
3. 구독 스키마 마이그레이션
4. 무료 플랜 제한 적용

**궁금한 점**:
- 결제 시스템부터 구현할까요?
- B2B vs B2C 중 어디에 집중하고 싶으신가요?
- 목표 가격대 의견이 있으신가요?
