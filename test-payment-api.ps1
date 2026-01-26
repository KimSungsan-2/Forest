# Toss Payments API 테스트 스크립트 (PowerShell)
# 사용법: .\test-payment-api.ps1

Write-Host "🧪 Toss Payments API 테스트 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. 회원가입 (이미 있으면 스킵)
Write-Host "1️⃣ 테스트 계정 생성..." -ForegroundColor Yellow

$signupBody = @{
    email = "test-payment@example.com"
    password = "test1234!"
    displayName = "결제테스트"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/signup" `
        -Method Post `
        -ContentType "application/json" `
        -Body $signupBody

    $token = $signupResponse.token
    Write-Host "✅ 회원가입 성공" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 회원가입 실패. 로그인 시도..." -ForegroundColor Yellow

    $loginBody = @{
        email = "test-payment@example.com"
        password = "test1234!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.token
    Write-Host "✅ 로그인 성공" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ 토큰 획득: $($token.Substring(0, 30))..." -ForegroundColor Green
Write-Host ""

# 2. 결제 초기화
Write-Host "2️⃣ 결제 초기화 (프리미엄 플랜)..." -ForegroundColor Yellow

$initBody = @{
    plan = "premium"
    successUrl = "http://localhost:3000/payment/success"
    failUrl = "http://localhost:3000/payment/fail"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $initResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payments/initialize" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $initBody

    Write-Host "✅ 주문 생성 완료" -ForegroundColor Green
    Write-Host "   OrderID: $($initResponse.orderId)" -ForegroundColor Cyan
    Write-Host "   Amount: ₩$($initResponse.amount)" -ForegroundColor Cyan
    Write-Host "   OrderName: $($initResponse.orderName)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 결제 초기화 실패" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""

# 3. 구독 정보 조회
Write-Host "3️⃣ 현재 구독 상태 확인..." -ForegroundColor Yellow

try {
    $subscriptionResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/payments/subscription" `
        -Method Get `
        -Headers $headers

    if ($subscriptionResponse.subscription) {
        Write-Host "✅ 구독 정보:" -ForegroundColor Green
        Write-Host "   Plan: $($subscriptionResponse.subscription.plan)" -ForegroundColor Cyan
        Write-Host "   Status: $($subscriptionResponse.subscription.status)" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ 아직 구독이 없습니다" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 구독 조회 실패" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ API 테스트 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. 브라우저에서 http://localhost:3000/pricing 접속"
Write-Host "   2. '업그레이드' 버튼 클릭"
Write-Host "   3. 테스트 카드로 결제: 4330-1234-5678-9012"
Write-Host "   4. 유효기간: 12/25, CVC: 123, 생년월일: 990101, 비밀번호: 12"
Write-Host ""
