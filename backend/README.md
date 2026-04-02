# Auth Service Backend

Go API для Discord OAuth2, JWT и управления пользователями.

## Запуск

```bash
cp env.example config.env
go run ./cmd/migrator
go run .
```

Backend слушает `SERVER_PORT`, по умолчанию `8080`.

## Основные команды

```bash
go test ./...
go build ./...
make deploy-prep
```

## Структура

- `cmd/migrator/` — CLI для миграций
- `internal/config/` — загрузка env и runtime-конфигурация
- `internal/database/` — PostgreSQL repositories
- `internal/handlers/` — HTTP handlers
- `internal/middleware/` — auth и access control
- `internal/services/` — бизнес-логика
- `migrations/` — SQL-миграции для `users` и `refresh_tokens`

## Важные env

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ALLOWED_RETURN_URLS`
- `DATABASE_URL`
- `SERVER_PORT`
- `ADMIN_DISCORD_IDS`

## External Service Login

Backend поддерживает внешний redirect flow:

```text
GET /api/login?return_to=https://app.example.com/auth/callback
```

`return_to` должен быть заранее добавлен в `ALLOWED_RETURN_URLS`.

Подробности по production deploy: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
