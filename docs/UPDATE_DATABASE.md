# Обновление базы данных

Проект использует SQL-миграции из [backend/migrations](../backend/migrations).

## Применить миграции

```bash
cd backend
go run ./cmd/migrator
```

Мигратор читает:

- `DATABASE_URL`
- `MIGRATIONS_PATH` — опционально, по умолчанию `migrations`

## Локальный запуск

```powershell
$env:DATABASE_URL="postgres://auth:password@localhost:5432/authdb?sslmode=disable"
cd backend
go run ./cmd/migrator
```

## Проверка структуры

Пример через `psql`:

```sql
\dt
\d users
\d refresh_tokens
```

## Полный пересозданный инстанс

1. Создайте пустую БД.
2. Укажите корректный `DATABASE_URL`.
3. Запустите мигратор.

Источником истины считаются текущие SQL-файлы в `backend/migrations`, а не отдельные исторические инструкции.
