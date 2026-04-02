#!/bin/bash

# Скрипт для установки временного токена для разработки
# Использование: ./set-dev-token.sh

echo "🔧 Установка временного токена для разработки..."

# Проверяем, что мы в корневой директории проекта
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Проверяем, что frontend запущен
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend не запущен на localhost:3000"
    echo "Запустите: cd frontend && npm run dev"
    exit 1
fi

# Проверяем, что backend запущен
if ! curl -s http://localhost:8080/health > /dev/null; then
    echo "❌ Backend не запущен на localhost:8080"
    echo "Запустите: cd backend && go run main.go"
    exit 1
fi

echo "✅ Frontend и backend запущены"

# Создаем временный токен через API
echo "🔑 Создание временного токена..."

# Сначала попробуем получить токен через существующий API
# Если у вас есть тестовый пользователь, используйте его данные
# Иначе создадим простой токен для разработки

# Создаем простой JWT токен для разработки (без подписи)
DEV_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiRGV2ZWxvcGVyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzM1MDQ0ODAwfQ.invalid_signature_for_dev"

echo "📝 Устанавливаем токен в cookies..."

# Открываем браузер и устанавливаем токен через JavaScript
cat > /tmp/set-token.js << 'EOF'
// Устанавливаем токен в cookies
document.cookie = "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiRGV2ZWxvcGVyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzM1MDQ0ODAwfQ.invalid_signature_for_dev; path=/; max-age=86400";
document.cookie = "refreshToken=dev_refresh_token; path=/; max-age=86400";

console.log("✅ Токен установлен!");
console.log("Токен:", document.cookie);

// Проверяем, что токен установлен
const token = document.cookie.split(';').find(c => c.trim().startsWith('accessToken='));
if (token) {
    console.log("✅ Токен успешно установлен в cookies");
    alert("Токен для разработки установлен! Теперь вы можете тестировать API.");
} else {
    console.log("❌ Не удалось установить токен");
    alert("Ошибка при установке токена");
}
EOF

echo "🌐 Откройте браузер и выполните следующий код в консоли:"
echo ""
echo "// Скопируйте и выполните этот код в консоли браузера:"
cat /tmp/set-token.js
echo ""
echo ""

# Альтернативный способ - через curl для установки cookies
echo "🔧 Альтернативный способ - через curl:"
echo ""
echo "curl -c cookies.txt -b cookies.txt -X POST http://localhost:3000/api/set-dev-token"
echo ""

# Создаем простой API endpoint для установки токена (если нужно)
cat > frontend/public/set-dev-token.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Установка токена для разработки</title>
</head>
<body>
    <h1>Установка токена для разработки</h1>
    <button onclick="setDevToken()">Установить токен</button>
    <script>
        function setDevToken() {
            // Устанавливаем токен в cookies
            document.cookie = "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZlbG9wZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiRGV2ZWxvcGVyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzM1MDQ0ODAwfQ.invalid_signature_for_dev; path=/; max-age=86400";
            document.cookie = "refreshToken=dev_refresh_token; path=/; max-age=86400";
            
            alert("Токен установлен! Теперь вы можете тестировать API.");
            console.log("Токен установлен:", document.cookie);
        }
    </script>
</body>
</html>
EOF

echo "✅ Создана страница для установки токена:"
echo "🌐 Откройте: http://localhost:3000/set-dev-token.html"
echo ""

# Очищаем временные файлы
rm -f /tmp/set-token.js

echo "🎉 Готово! Теперь вы можете:"
echo "1. Открыть http://localhost:3000/set-dev-token.html"
echo "2. Нажать кнопку 'Установить токен'"
echo "3. Или выполнить код JavaScript в консоли браузера"
echo ""
echo "⚠️  Внимание: Это токен только для разработки!"
