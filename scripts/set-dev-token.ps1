# PowerShell скрипт для установки временного токена для разработки
# Использование: .\set-dev-token.ps1

Write-Host "🔧 Установка временного токена для разработки..." -ForegroundColor Cyan

# Проверяем, что мы в корневой директории проекта
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Запустите скрипт из корневой директории проекта" -ForegroundColor Red
    exit 1
}

# Проверяем, что frontend запущен
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -ne 200) {
        throw "Frontend не отвечает"
    }
} catch {
    Write-Host "❌ Frontend не запущен на localhost:3000" -ForegroundColor Red
    Write-Host "Запустите: cd frontend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Проверяем, что backend запущен
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -ne 200) {
        throw "Backend не отвечает"
    }
} catch {
    Write-Host "❌ Backend не запущен на localhost:8080" -ForegroundColor Red
    Write-Host "Запустите: cd backend && go run main.go" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Frontend и backend запущены" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 Откройте браузер и перейдите по адресу:" -ForegroundColor Cyan
Write-Host "http://localhost:3000/set-dev-token.html" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔑 Или выполните этот код в консоли браузера:" -ForegroundColor Cyan
Write-Host ""
Write-Host "document.cookie = `"accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiRGV2ZWxvcGVyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzM1MDQ0ODAwfQ.invalid_signature_for_dev; path=/; max-age=86400`";" -ForegroundColor White
Write-Host "document.cookie = `"refreshToken=dev_refresh_token; path=/; max-age=86400`";" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Готово! Теперь вы можете тестировать API" -ForegroundColor Green
Write-Host "⚠️  Внимание: Это токен только для разработки!" -ForegroundColor Yellow
