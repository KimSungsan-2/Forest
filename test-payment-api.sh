#!/bin/bash

# Toss Payments API 테스트 스크립트
# 사용법: ./test-payment-api.sh

echo "🧪 Toss Payments API 테스트 시작..."
echo ""

# 1. 회원가입 (이미 있으면 스킵)
echo "1️⃣ 테스트 계정 생성..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-payment@example.com",
    "password": "test1234!",
    "displayName": "결제테스트"
  }')

echo "$SIGNUP_RESPONSE" | jq '.'

# 토큰 추출
TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ 회원가입 실패. 이미 계정이 있으면 로그인 시도..."

  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test-payment@example.com",
      "password": "test1234!"
    }')

  echo "$LOGIN_RESPONSE" | jq '.'
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
fi

echo ""
echo "✅ 토큰 획득: ${TOKEN:0:30}..."
echo ""

# 2. 결제 초기화
echo "2️⃣ 결제 초기화 (프리미엄 플랜)..."
INIT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plan": "premium",
    "successUrl": "http://localhost:3000/payment/success",
    "failUrl": "http://localhost:3000/payment/fail"
  }')

echo "$INIT_RESPONSE" | jq '.'

ORDER_ID=$(echo "$INIT_RESPONSE" | jq -r '.orderId')
AMOUNT=$(echo "$INIT_RESPONSE" | jq -r '.amount')

echo ""
echo "✅ 주문 생성 완료"
echo "   OrderID: $ORDER_ID"
echo "   Amount: ₩$AMOUNT"
echo ""

# 3. 구독 정보 조회
echo "3️⃣ 현재 구독 상태 확인..."
SUBSCRIPTION_RESPONSE=$(curl -s -X GET http://localhost:3001/api/payments/subscription \
  -H "Authorization: Bearer $TOKEN")

echo "$SUBSCRIPTION_RESPONSE" | jq '.'

echo ""
echo "✨ API 테스트 완료!"
echo ""
echo "📝 다음 단계:"
echo "   1. 브라우저에서 http://localhost:3000/pricing 접속"
echo "   2. '업그레이드' 버튼 클릭"
echo "   3. 테스트 카드로 결제: 4330-1234-5678-9012"
echo ""
