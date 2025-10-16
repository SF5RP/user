# User Service Frontend

Фронтенд приложение для сервиса авторизации через Discord OAuth2.

## 🛠️ Технологии

- **Next.js 15** с App Router и SSR
- **React 19** + **TypeScript**
- **Redux Toolkit** для глобального состояния
- **React Query** (TanStack Query) для API запросов
- **Emotion** для стилизации компонентов
- **react-hook-form** для управления формами

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router страницы
│   │   ├── layout.tsx         # Главный layout
│   │   ├── page.tsx           # Главная страница
│   │   ├── login/             # Страница входа
│   │   ├── callback/          # OAuth callback
│   │   ├── profile/           # Страница профиля
│   │   └── admin/             # Админ панель
│   │       └── users/         # Управление пользователями
│   │
│   ├── features/              # Feature-oriented модули
│   │   ├── auth/              # Авторизация
│   │   │   ├── authSlice.ts   # Redux slice
│   │   │   └── hooks.ts       # React Query hooks
│   │   ├── profile/           # Профиль пользователя
│   │   └── admin/             # Админ функционал
│   │       └── hooks.ts       # Админ hooks
│   │
│   └── shared/                # Общие компоненты и утилиты
│       ├── components/        # Переиспользуемые компоненты
│       │   └── providers.tsx  # Redux & React Query провайдеры
│       ├── hooks/             # Кастомные хуки
│       │   └── redux.ts       # Типизированные Redux хуки
│       ├── lib/               # Библиотеки и утилиты
│       │   ├── store.ts       # Redux store
│       │   └── api.ts         # API клиент
│       ├── types/             # TypeScript типы
│       │   └── auth.ts        # Auth типы
│       └── ui/                # UI компоненты
│           ├── button.tsx
│           ├── card.tsx
│           └── container.tsx
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 4. Сборка для продакшена

```bash
npm run build
npm start
```

## 📄 Основные страницы

- **/** - Главная страница с приветствием
- **/login** - Страница входа через Discord
- **/callback** - Обработка OAuth callback
- **/profile** - Профиль пользователя
- **/admin/users** - Управление пользователями (только для админов)

## 🔐 Авторизация

1. Пользователь нажимает "Войти через Discord"
2. Перенаправление на бэкенд `/login`
3. Discord OAuth2 авторизация
4. Callback с токенами
5. Сохранение токенов в cookies
6. Автоматический переход в профиль

## 🎨 Стилизация

Используется **Emotion** для CSS-in-JS:

```tsx
import styled from "@emotion/styled";

const Button = styled.button`
  padding: 12px 24px;
  background: #5865f2;
  color: white;
  border-radius: 8px;
`;
```

## 🔄 Управление состоянием

### Redux Toolkit (глобальное состояние)

```tsx
import { useAppSelector } from "@/shared/hooks/redux";
const { user, isAuthenticated } = useAppSelector((state) => state.auth);
```

### React Query (API запросы)

```tsx
import { useCurrentUser } from "@/features/auth/hooks";
const { data: user, isLoading } = useCurrentUser();
```

## 🔌 API интеграция

API клиент в `src/shared/lib/api.ts`:

```tsx
import { api } from "@/shared/lib/api";

// GET запрос
const data = await api.get("/me", { requiresAuth: true });

// POST запрос
await api.post(
  "/admin/users/123/role",
  { role: "admin" },
  { requiresAuth: true }
);
```

## 📦 Основные зависимости

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "@reduxjs/toolkit": "^2.2.7",
  "@tanstack/react-query": "^5.56.2",
  "@emotion/react": "^11.13.3",
  "react-hook-form": "^7.53.0"
}
```

## 🎯 Соглашения о коде

- Используйте `export const` вместо `export default`
- Имена компонентов и папок в **camelCase**
- Функциональные компоненты и кастомные хуки
- Описательные имена переменных (isLoading, hasError, canEdit)
- TypeScript `interface` вместо `type`
- Ранние возвраты и guard clauses

## 🧪 Разработка

При разработке нового функционала:

1. Создайте feature папку в `src/features/`
2. Добавьте типы в `src/shared/types/`
3. Создайте переиспользуемые UI компоненты в `src/shared/ui/`
4. Используйте React Query для API запросов
5. Используйте Redux только для глобального состояния

## 🔧 Следующие шаги

- [ ] Добавить обработку ошибок
- [ ] Добавить уведомления (toasts)
- [ ] Добавить защиту роутов (middleware)
- [ ] Добавить unit тесты
- [ ] Добавить E2E тесты
- [ ] Оптимизировать изображения
- [ ] Добавить темную тему

## 📝 Лицензия

MIT

# upstream'ы: поменяйте порты под ваш бек и фронт

upstream user_backend { server 127.0.0.1:12410; }
upstream user_frontend { server 127.0.0.1:12412; } # или ваш PORT

server {
listen 80;
server_name u.aidew.ru;

    # health
    location /health {
        proxy_pass http://user_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API (если без префикса /api – как у вас)
    location ~ ^/(login|callback|admin|refresh|me|logout|servers|characters) {
        proxy_pass http://user_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статика фронта
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://user_frontend;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Остальное — на Next.js
    location / {
        proxy_pass http://user_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
