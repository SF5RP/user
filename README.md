# Auth Service

Сервис авторизации на `Go + Next.js` с Discord OAuth2, JWT и PostgreSQL.

## Что в репозитории

- `backend/` — API, OAuth, JWT, миграции и бизнес-логика
- `frontend/` — Next.js App Router интерфейс
- `deploy/` — `systemd` и nginx-примеры для production
- `docs/DEPLOYMENT.md` — актуальная инструкция по деплою без Docker
- `docs/UPDATE_DATABASE.md` — заметки по миграциям и обновлению БД
- `docs/AUTH_INTEGRATION.md` — интеграция `auth-service` в остальные сервисы

## Локальный запуск

1. Скопируйте [backend/env.example](./backend/env.example) в `backend/config.env` и заполните значения.
2. Создайте `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Поднимите PostgreSQL и примените миграции:

```bash
cd backend
go run ./cmd/migrator
```

4. Запустите backend:

```bash
cd backend
go run .
```

5. Запустите frontend:

```bash
cd frontend
yarn install
yarn dev
```

## Production deploy

Используется release-based схема без Docker:

- backend и frontend собираются отдельно
- на сервер загружаются `tar.gz` bundle
- release распаковывается в `/srv/auth-service/releases/...`
- `current/backend` и `current/frontend` переключаются симлинком
- сервисы запускаются через `systemd`

Backend release:

```bash
cd backend
make deploy-prep
tar -czf auth-service-backend.tar.gz -C dist auth-service-backend
```

Frontend release:

```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://your-domain/api
yarn deploy:prep
tar -czf auth-service-frontend.tar.gz -C dist auth-service-frontend
```

Серверные скрипты:

```bash
./backend/deploy/deploy_backend.sh /path/to/auth-service-backend.tar.gz
./frontend/deploy/deploy_frontend.sh /path/to/auth-service-frontend.tar.gz
```

Подробности: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Основные маршруты API

- `GET /health`
- `GET /api/login`
- `GET /api/login?return_to=https://app.example.com/auth/callback`
- `GET /api/callback`
- `POST /api/refresh`
- `GET /api/me`
- `GET /api/admin/users`
- `POST /api/admin/users/:id/role`

## Multi-Service Auth

Для интеграции с другими сервисами поддерживается `return_to`:

```text
GET /api/login?return_to=https://app.example.com/auth/callback
```

После успешного Discord login пользователь будет возвращён в разрешённый callback URL с `access_token` и `refresh_token`.

Разрешённые внешние callback URL задаются через `ALLOWED_RETURN_URLS`.

## Документация

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
- [docs/README.md](./docs/README.md)
