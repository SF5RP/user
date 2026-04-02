# Auth Service Frontend

Next.js 15 frontend для логина, профиля и админки пользователей.

## Команды

```bash
yarn install
yarn dev
yarn build
yarn deploy:prep
```

## Env

Создайте `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Структура

- `src/app/` — маршруты App Router
- `src/features/` — feature-модули
- `src/shared/` — UI, hooks, api, types, shared components
- `public/` — статические файлы
- `scripts/prepare-deploy.js` — упаковка standalone release bundle
- `deploy/` — серверный deploy-скрипт и runtime env example

## Production bundle

`yarn deploy:prep`:

1. собирает Next.js standalone output
2. копирует его в `dist/auth-service-frontend`
3. добавляет `.next/static` и `public/`

Nginx-конфиг лежит в [../deploy/nginx/auth-service.conf](../deploy/nginx/auth-service.conf), а полный production deploy описан в [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).
