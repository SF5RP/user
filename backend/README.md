# 🔐 User Service - Backend

Go backend для системы авторизации через Discord OAuth2.

---

## 🚀 Быстрый старт

### Установка зависимостей

```bash
go mod download
```

### Настройка конфигурации

```bash
cp env.example config.env
# Отредактируйте config.env
```

### Запуск миграций

```bash
go run cmd/migrator/main.go up
```

### Запуск сервера

```bash
go run main.go
```

Сервер запустится на `http://localhost:8080`

---

## 📁 Структура

```
backend/
├── cmd/                 # Точки входа приложения
│   └── migrator/       # Утилита миграций БД
├── internal/           # Внутренняя логика
│   ├── config/        # Конфигурация
│   ├── database/      # Репозитории БД
│   ├── handlers/      # HTTP handlers
│   ├── middleware/    # Middleware (auth, CORS)
│   ├── models/        # Модели данных
│   └── services/      # Бизнес-логика
├── migrations/        # SQL миграции
├── main.go           # Точка входа
├── go.mod            # Go dependencies
└── env.example       # Пример конфигурации
```

---

## 🔧 API Endpoints

### Публичные

- `GET /health` - Health check
- `GET /login` - Начало OAuth flow
- `GET /callback` - Discord callback
- `POST /refresh` - Обновление токенов

### Защищенные (требуют JWT)

- `GET /me` - Текущий пользователь
- `GET /characters` - Список персонажей
- `POST /characters` - Создать персонажа
- `DELETE /characters/:id` - Удалить персонажа

### Админские

- `GET /admin/users` - Список пользователей
- `POST /admin/users/:id/role` - Изменить роль

---

## 🗄️ База данных

### Миграции

```bash
# Применить все миграции
go run cmd/migrator/main.go up

# Откатить последнюю миграцию
go run cmd/migrator/main.go down

# Откатить все миграции
go run cmd/migrator/main.go down -all
```

### Подключение

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=authdb
DB_USER=auth
DB_PASSWORD=your_password
```

---

## 🧪 Тестирование

```bash
# Запуск всех тестов
go test ./...

# Тесты с покрытием
go test -cover ./...

# Verbose output
go test -v ./...
```

---

## 🔐 Переменные окружения

См. `env.example` для полного списка переменных.

**Обязательные:**

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `JWT_SECRET`
- `DB_PASSWORD`

---

## 📚 Документация

- [Главная](../README.md)
- [Полная документация](../docs/)
- [Деплой](../docs/DEPLOYMENT.md)

---

## 🚢 CI/CD (миграции через деплой)

Ниже примеры, как запускать миграции автоматически в пайплайнах перед запуском приложения.

### Docker Compose (CI/CD job)

```bash
# Выполнить миграции и завершить контейнер мигратора
docker compose run --rm migrate

# Запустить приложение (после успешных миграций)
docker compose up -d app
```

Или одним шагом (если в compose настроен depends_on для `app` от `migrate`):

```bash
docker compose up -d --build
```

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build & push images
        run: |
          docker compose build
          docker compose push || true

      - name: Run DB migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          docker compose run --rm migrate

      - name: Start app
        env:
          DISCORD_CLIENT_ID: ${{ secrets.DISCORD_CLIENT_ID }}
          DISCORD_CLIENT_SECRET: ${{ secrets.DISCORD_CLIENT_SECRET }}
          DISCORD_REDIRECT_URI: ${{ secrets.DISCORD_REDIRECT_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
        run: |
          docker compose up -d app
```

### GitLab CI

```yaml
stages:
  - build
  - migrate
  - deploy

variables:
  DOCKER_DRIVER: overlay2

build:
  stage: build
  script:
    - docker compose build
    - docker compose push || true

migrate:
  stage: migrate
  script:
    - docker compose run --rm migrate
  when: on_success

deploy:
  stage: deploy
  script:
    - docker compose up -d app
  needs: ["migrate"]
```

Примечания:

- Обязательно передавайте `DATABASE_URL` (и при необходимости `MIGRATIONS_PATH`) в окружение задания миграций.
- Следите, чтобы схемы БД и переменные окружения у `migrate` и `app` совпадали.
- Если хостинг управляет Docker вне CI (например, на VM), используйте те же команды вручную или через SSH шаги в пайплайне.

---

## 🛠️ Разработка

### Добавление новой миграции

Создайте файлы в `migrations/`:

```
XXXX_description.up.sql
XXXX_description.down.sql
```

### Добавление нового endpoint

1. Создайте handler в `internal/handlers/`
2. Добавьте route в `main.go`
3. При необходимости создайте service в `internal/services/`

### Запуск в Docker

```bash
# Из корня проекта
docker-compose up backend
```

---

## 🔧 Полезные команды

```bash
# Форматирование кода
go fmt ./...

# Линтинг
golangci-lint run

# Сборка бинарника
go build -o user-service ./main.go

# Production build (Linux)
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o user-service ./main.go
```
