# 🧪 Toss Payments 결제 플로우 테스트 가이드

## 📋 사전 준비

### 1. 환경변수 확인
✅ **Backend** (`.env`):
```env
TOSS_SECRET_KEY="test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
TOSS_CLIENT_KEY="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"
```

✅ **Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

### 2. 서버 실행 확인
```bash
# Backend (포트 3001)
cd backend && npm run dev

# Frontend (포트 3000)
cd apps/web && npm run dev
```

### 3. 회원가입 및 로그인
- http://localhost:3000/signup 에서 테스트 계정 생성
- 로그인 완료

---

## 🧪 테스트 시나리오

### 시나리오 1: 프리미엄 플랜 결제 성공 ✅

#### Step 1: Pricing 페이지 이동
```
http://localhost:3000/pricing
```

#### Step 2: "프리미엄" 플랜의 "업그레이드 →" 버튼 클릭
- 금액: **₩9,900/월**
- Toss Payments 결제 위젯이 팝업으로 열림

#### Step 3: 테스트 카드 정보 입력

**✨ Toss Payments 테스트 카드**

| 항목 | 값 |
|------|-----|
| **카드번호** | `4330-1234-5678-9012` |
| **유효기간** | `12/25` (미래 날짜 아무거나) |
| **CVC** | `123` (3자리 아무 숫자) |
| **생년월일** | `990101` (6자리 아무 숫자) |
| **비밀번호 앞 2자리** | `12` (2자리 아무 숫자) |

> 💡 **주의**: 이 카드 정보는 테스트 전용입니다. 실제 결제는 되지 않습니다.

#### Step 4: 결제 승인
- "결제하기" 버튼 클릭
- **예상 동작**:
  1. 팝업이 닫히고 `/payment/success?paymentKey=xxx&orderId=xxx&amount=9900`로 리다이렉트
  2. "결제 처리 중" 메시지 표시 (로딩 스피너)
  3. Backend에서 결제 승인 API 호출
  4. "결제 완료!" 메시지와 ✅ 아이콘
  5. 3초 후 자동으로 `/dashboard`로 이동

#### Step 5: 검증
- **Frontend**:
  - UsageBanner가 사라져야 함 (프리미엄 사용자는 표시 안됨)
  - Pricing 페이지에서 "현재 플랜" 표시

- **Backend 로그**:
  ```
  POST /api/payments/initialize → 200
  POST /api/payments/confirm → 200
  ```

- **Database (Supabase)**:
  ```sql
  -- Subscription 확인
  SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
  -- plan: 'premium', status: 'active'

  -- Payment 확인
  SELECT * FROM payments WHERE user_id = 'YOUR_USER_ID';
  -- status: 'completed', amount: 9900
  ```

---

### 시나리오 2: 패밀리 플랜 결제 성공 ✅

#### Step 1: Pricing 페이지에서 "패밀리" 플랜의 "업그레이드 →" 클릭
- 금액: **₩14,900/월**

#### Step 2: 테스트 카드로 결제
- 위와 동일한 테스트 카드 정보 사용

#### Step 3: 검증
- Database에서 `plan: 'family'`, `amount: 14900` 확인

---

### 시나리오 3: 결제 실패 (카드 한도 초과) ❌

#### Step 1: 한도 초과 테스트 카드 사용

**❌ 테스트 실패 카드**

| 항목 | 값 |
|------|-----|
| **카드번호** | `5339-9999-9999-9999` |
| 유효기간 | `12/25` |
| CVC | `123` |

#### Step 2: 결제 시도
- **예상 동작**:
  1. Toss Payments에서 "카드 한도를 초과했습니다" 에러
  2. `/payment/fail?code=PAY_PROCESS_ABORTED&message=...`로 리다이렉트
  3. 😢 아이콘과 "결제 실패" 메시지
  4. "다시 시도하기" 버튼 표시

#### Step 3: 검증
- Database에서 `status: 'failed'` 확인
- Backend 로그:
  ```
  POST /api/payments/fail → 200
  ```

---

### 시나리오 4: 사용자 취소 🚫

#### Step 1: 결제 위젯에서 "X" 버튼 또는 뒤로가기
- **예상 동작**:
  - `/payment/fail?code=USER_CANCEL&message=사용자가 결제를 취소했습니다`로 리다이렉트
  - "결제 실패" 페이지 표시

---

### 시나리오 5: 무료 사용자 → 프리미엄 업그레이드 확인 🎉

#### Step 1: 무료 플랜으로 회고 9회 작성
```
http://localhost:3000/vent
```
- 9번 회고 작성 → UsageBanner: "이번 달 1회 남음" (파란색)

#### Step 2: 10회 작성 시도
- **예상 동작**:
  - UsageBanner가 빨간색으로 변경: "월 사용 한도를 모두 사용했습니다"
  - "지금 업그레이드" 버튼 표시
  - 회고 작성 시 `402 Payment Required` 에러

#### Step 3: 업그레이드
- UsageBanner의 "지금 업그레이드" 클릭 → `/pricing`
- 프리미엄 결제 완료

#### Step 4: 검증
- UsageBanner 사라짐
- 회고 무제한 작성 가능
- `/mind-weather` 페이지 접근 가능 (이전에는 402 에러)

---

## 🔍 디버깅 팁

### 1. Backend 로그 확인
```bash
cd backend && npm run dev
```
- `POST /api/payments/initialize` - orderId, amount 확인
- `POST /api/payments/confirm` - paymentKey, Toss 응답 확인

### 2. Frontend 콘솔 확인
```javascript
// useTossPayments hook의 error 상태
console.log('Payment Error:', error);
```

### 3. Network 탭 (Chrome DevTools)
- `POST http://localhost:3001/api/payments/initialize`
  - Request: `{ plan: "premium" }`
  - Response: `{ orderId, amount, orderName, ... }`

- `POST http://localhost:3001/api/payments/confirm`
  - Request: `{ paymentKey, orderId, amount }`
  - Response: `{ subscription, payment, tossResponse }`

### 4. Database 직접 확인 (Supabase)
```sql
-- 최근 구독 확인
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;

-- 최근 결제 확인
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- 특정 사용자 구독 상태
SELECT u.email, s.plan, s.status, s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;
```

---

## ⚠️ 알려진 이슈

### 1. Toss SDK 로드 에러
**증상**: "결제 시스템이 준비되지 않았습니다"
**해결**:
- 브라우저 콘솔에서 `window.TossPayments` 확인
- 네트워크에서 `https://js.tosspayments.com/v1/payment` 로드 확인
- 페이지 새로고침

### 2. CORS 에러
**증상**: `POST http://localhost:3001/api/payments/initialize` 실패
**해결**:
- Backend `.env`의 `ALLOWED_ORIGINS` 확인
- Backend 서버 재시작

### 3. 401 Unauthorized
**증상**: 결제 API 호출 시 인증 에러
**해결**:
- 로그인 상태 확인
- localStorage에 `token` 있는지 확인
- 토큰 만료 시 재로그인

---

## 📊 테스트 체크리스트

- [ ] 환경변수 설정 완료
- [ ] Backend/Frontend 서버 실행 중
- [ ] 회원가입 및 로그인 완료
- [ ] 프리미엄 플랜 결제 성공
- [ ] 패밀리 플랜 결제 성공
- [ ] 결제 실패 플로우 확인
- [ ] 사용자 취소 플로우 확인
- [ ] 무료 한도 도달 → 업그레이드 플로우
- [ ] UsageBanner 동작 확인
- [ ] Database에 데이터 정상 저장 확인
- [ ] 결제 후 프리미엄 기능 접근 가능 확인

---

## 🚀 다음 단계

결제 테스트가 완료되면:
1. **자동 결제**: 월 구독 갱신을 위한 빌링키 자동결제
2. **구독 관리 페이지**: 사용자가 구독 취소/변경할 수 있는 UI
3. **이메일 알림**: 결제 성공/실패 이메일 발송 (SendGrid, AWS SES)
4. **결제 모니터링**: Admin 대시보드에서 결제 현황 확인
5. **실제 배포**: Toss Payments 실제 키로 변경 및 프로덕션 배포

---

## 📞 문제 발생 시

1. **Toss Payments 테스트 환경 확인**: https://developers.tosspayments.com/sandbox
2. **Backend 로그 확인**: `npm run dev` 출력
3. **Frontend 콘솔 확인**: Chrome DevTools → Console
4. **Database 확인**: Supabase 대시보드

테스트 중 이슈가 발생하면 위 정보를 공유해주세요!
