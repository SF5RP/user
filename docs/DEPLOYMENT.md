# Деплой без Docker

Этот документ описывает production-деплой `auth-service` без Docker. Схема release-based:

- backend и frontend собираются отдельно
- каждый новый релиз распаковывается в отдельную папку
- `current/backend` и `current/frontend` переключаются симлинком
- процессы запускаются через `systemd`
- nginx принимает внешний трафик и проксирует его на backend/frontend

Такой подход даёт:

- простой rollback через переключение симлинка
- независимый деплой backend и frontend
- отсутствие зависимости от Docker runtime на сервере

## Что будет на сервере

```bash
/srv/auth-service/
  releases/
    backend/
      2026-04-02_210501/
    frontend/
      2026-04-02_210742/
  current/
    backend -> /srv/auth-service/releases/backend/2026-04-02_210501/auth-service-backend
    frontend -> /srv/auth-service/releases/frontend/2026-04-02_210742/auth-service-frontend
  shared/
    backend/env/backend.env
    frontend/env/frontend.env
```

## Что нужно заранее

Минимальные требования:

- Ubuntu 22.04/24.04 или другая Linux-система с `systemd`
- домен, например `auth.example.com`
- PostgreSQL
- nginx
- Node.js 20+ для frontend runtime
- пользователь `deploy`
- доступ к Discord Developer Portal

Нужны такие значения:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `JWT_SECRET`
- `DATABASE_URL`
- `FRONTEND_URL`
- `ALLOWED_RETURN_URLS`
- `ADMIN_DISCORD_IDS` при необходимости

## Архитектура рантайма

Production-схема в этом репозитории такая:

- Go backend слушает порт `8080`
- Next.js standalone frontend слушает порт `3000`
- nginx принимает запросы на `80/443`
- `/api/*` и `/health` уходят в backend
- остальные запросы уходят во frontend

Внешне сервис выглядит как один сайт, но внутри это два `systemd`-сервиса.

## Шаг 1. Подготовить сервер

Пример для Ubuntu:

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib curl git tar
```

Установите Node.js 20+ любым стандартным способом. Например через NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

Проверьте путь до `node`, он понадобится для `systemd`:

```bash
which node
```

Создайте пользователя для деплоя, если его ещё нет:

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG www-data deploy
```

## Шаг 2. Подготовить PostgreSQL

Создайте пользователя БД и отдельную базу:

```bash
sudo -u postgres psql
```

Внутри `psql`:

```sql
CREATE USER auth WITH PASSWORD 'change_me_strong_password';
CREATE DATABASE authdb OWNER auth;
\q
```

Проверьте подключение:

```bash
psql "postgres://auth:change_me_strong_password@127.0.0.1:5432/authdb?sslmode=disable"
```

Если база находится на другом хосте, используйте его адрес в `DATABASE_URL`.

## Шаг 3. Подготовить директории приложения

```bash
sudo mkdir -p /srv/auth-service/releases/backend
sudo mkdir -p /srv/auth-service/releases/frontend
sudo mkdir -p /srv/auth-service/current
sudo mkdir -p /srv/auth-service/shared/backend/env
sudo mkdir -p /srv/auth-service/shared/frontend/env
sudo chown -R deploy:deploy /srv/auth-service
```

## Шаг 4. Подготовить production env-файлы

### Backend env

Возьмите шаблон [backend/env.example](/C:/Users/forkp/WebstormProjects/casino/auth/backend/env.example) и создайте на сервере:

```bash
sudo cp backend/env.example /srv/auth-service/shared/backend/env/backend.env
sudo chown deploy:deploy /srv/auth-service/shared/backend/env/backend.env
sudo chmod 600 /srv/auth-service/shared/backend/env/backend.env
sudo nano /srv/auth-service/shared/backend/env/backend.env
```

Пример production-конфига:

```env
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=replace_me
DISCORD_REDIRECT_URI=https://auth.example.com/api/callback

FRONTEND_URL=https://auth.example.com
ALLOWED_RETURN_URLS=https://casino.example.com/auth/callback,https://admin.example.com/auth/callback

JWT_SECRET=replace_with_long_random_secret

SERVER_PORT=8080
ENVIRONMENT=production

ADMIN_DISCORD_IDS=111111111111111111,222222222222222222

DATABASE_URL=postgres://auth:change_me_strong_password@127.0.0.1:5432/authdb?sslmode=disable
```

Важно:

- `DISCORD_REDIRECT_URI` должен точно совпадать с callback URL в Discord OAuth2 application
- `FRONTEND_URL` должен указывать на внешний адрес auth-сервиса
- `ALLOWED_RETURN_URLS` должен содержать все разрешённые `return_to`
- для backend реально используется `DATABASE_URL`; поля `DB_HOST`, `DB_PORT` и похожие здесь не обязательны

### Frontend env

Возьмите шаблон [frontend/deploy/frontend.env.example](/C:/Users/forkp/WebstormProjects/casino/auth/frontend/deploy/frontend.env.example) и создайте:

```bash
sudo cp frontend/deploy/frontend.env.example /srv/auth-service/shared/frontend/env/frontend.env
sudo chown deploy:deploy /srv/auth-service/shared/frontend/env/frontend.env
sudo chmod 600 /srv/auth-service/shared/frontend/env/frontend.env
sudo nano /srv/auth-service/shared/frontend/env/frontend.env
```

Пример:

```env
NODE_ENV=production
PORT=3000
```

Важно понимать разницу:

- `frontend.env` используется только во время runtime
- `NEXT_PUBLIC_*` переменные не читаются из `frontend.env`
- `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_APP_URL` вшиваются в frontend на этапе сборки

## Шаг 5. Настроить Discord OAuth2

В Discord Developer Portal:

1. Откройте ваше приложение.
2. Перейдите в раздел OAuth2.
3. Добавьте redirect URL:

```text
https://auth.example.com/api/callback
```

4. Скопируйте `Client ID` и `Client Secret`.

Если `DISCORD_REDIRECT_URI` в env и redirect URL в Discord не совпадают, логин работать не будет.

## Шаг 6. Настроить systemd

В репозитории есть готовые шаблоны:

- [deploy/systemd/auth-service-backend.service.example](/C:/Users/forkp/WebstormProjects/casino/auth/deploy/systemd/auth-service-backend.service.example)
- [deploy/systemd/auth-service-frontend.service.example](/C:/Users/forkp/WebstormProjects/casino/auth/deploy/systemd/auth-service-frontend.service.example)

### Backend unit

```bash
sudo cp deploy/systemd/auth-service-backend.service.example /etc/systemd/system/auth-service-backend.service
```

### Frontend unit

```bash
sudo cp deploy/systemd/auth-service-frontend.service.example /etc/systemd/system/auth-service-frontend.service
```

Проверьте `ExecStart` у frontend unit. По умолчанию там:

```ini
ExecStart=/usr/bin/node server.js
```

Если `which node` вернул другой путь, замените его.

После этого:

```bash
sudo systemctl daemon-reload
sudo systemctl enable auth-service-backend
sudo systemctl enable auth-service-frontend
```

Сервисы можно не запускать сразу: сначала лучше загрузить первый релиз.

### Опционально: sudo без пароля для deploy-скриптов

Скрипты деплоя пытаются сделать `systemctl restart ...`. Для пользователя `deploy` удобно разрешить это через sudoers:

```bash
sudo visudo
```

Добавьте:

```text
deploy ALL=(ALL) NOPASSWD:/bin/systemctl restart auth-service-backend
deploy ALL=(ALL) NOPASSWD:/bin/systemctl restart auth-service-frontend
```

Без этого деплой-скрипты тоже можно использовать, но запускать их придётся от `root` или вручную перезапускать сервисы.

## Шаг 7. Настроить nginx

В репозитории есть готовый шаблон:

- [deploy/nginx/auth-service.conf](/C:/Users/forkp/WebstormProjects/casino/auth/deploy/nginx/auth-service.conf)

Установите его:

```bash
sudo cp deploy/nginx/auth-service.conf /etc/nginx/sites-available/auth-service
sudo nano /etc/nginx/sites-available/auth-service
```

Замените:

- `your-domain.com`
- `www.your-domain.com`

на ваш домен, например `auth.example.com`.

Активируйте конфиг:

```bash
sudo ln -s /etc/nginx/sites-available/auth-service /etc/nginx/sites-enabled/auth-service
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS

Для production нужен HTTPS, иначе OAuth и cookies быстро начнут ломаться в реальной среде. Самый простой вариант:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d auth.example.com
```

После этого `certbot` обычно сам обновляет nginx-конфиг под TLS.

## Шаг 8. Собрать backend release

Сборка делается не на сервере, а локально или в CI.

Команда:

```bash
cd backend
make deploy-prep
tar -czf auth-service-backend.tar.gz -C dist auth-service-backend
```

Что делает `make deploy-prep`:

- собирает Linux binary `auth-service`
- собирает Linux binary `auth-service-migrator`
- копирует папку `migrations`
- добавляет `deploy/deploy_backend.sh`

Итоговый архив содержит:

- `auth-service`
- `auth-service-migrator`
- `migrations/`
- `deploy/deploy_backend.sh`

## Шаг 9. Собрать frontend release

Перед сборкой обязательно задайте production `NEXT_PUBLIC_*` переменные.

Пример:

```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://auth.example.com/api
export NEXT_PUBLIC_APP_URL=https://auth.example.com
yarn install --immutable
yarn deploy:prep
tar -czf auth-service-frontend.tar.gz -C dist auth-service-frontend
```

Что делает `yarn deploy:prep`:

- выполняет `next build`
- собирает standalone output
- копирует bundle в `dist/auth-service-frontend`
- добавляет `.next/static`
- добавляет `public/`

Важно:

- если забыть выставить `NEXT_PUBLIC_API_URL`, frontend будет ходить не туда
- после изменения `NEXT_PUBLIC_*` нужен новый build, runtime-переменными это не исправить

## Шаг 10. Передать архивы на сервер

Например через `scp`:

```bash
scp backend/auth-service-backend.tar.gz deploy@server:/tmp/
scp frontend/auth-service-frontend.tar.gz deploy@server:/tmp/
```

Или используйте ваш стандартный CI/CD-канал.

## Шаг 11. Задеплоить backend

На сервере:

```bash
cd /tmp
bash /path/to/repo/backend/deploy/deploy_backend.sh /tmp/auth-service-backend.tar.gz
```

Если вы заранее положили release bundle вместе со скриптом, можно запускать скрипт прямо из распакованного архива. Логика скрипта такая:

1. Создаёт новую папку релиза в `/srv/auth-service/releases/backend/<timestamp>`.
2. Распаковывает архив.
3. Загружает `/srv/auth-service/shared/backend/env/backend.env`.
4. Запускает миграции через `auth-service-migrator`.
5. Переключает `/srv/auth-service/current/backend`.
6. Перезапускает `auth-service-backend`.

Это значит, что при каждом backend deploy миграции применяются автоматически.

## Шаг 12. Задеплоить frontend

На сервере:

```bash
cd /tmp
bash /path/to/repo/frontend/deploy/deploy_frontend.sh /tmp/auth-service-frontend.tar.gz
```

Скрипт:

1. Создаёт новую папку релиза в `/srv/auth-service/releases/frontend/<timestamp>`.
2. Распаковывает архив.
3. Загружает `/srv/auth-service/shared/frontend/env/frontend.env`.
4. Переключает `/srv/auth-service/current/frontend`.
5. Перезапускает `auth-service-frontend`.

## Шаг 13. Проверить сервис после деплоя

Проверьте оба сервиса:

```bash
sudo systemctl status auth-service-backend
sudo systemctl status auth-service-frontend
```

Посмотрите логи:

```bash
sudo journalctl -u auth-service-backend -n 100 --no-pager
sudo journalctl -u auth-service-frontend -n 100 --no-pager
```

Проверьте локальные порты:

```bash
curl http://127.0.0.1:8080/health
curl -I http://127.0.0.1:3000
```

Проверьте внешний домен:

```bash
curl -I https://auth.example.com
curl https://auth.example.com/health
```

Проверьте руками:

1. открывается главная страница
2. работает переход на Discord login
3. callback после авторизации возвращает пользователя обратно
4. `/api/me` отвечает после логина

## Ежедневный сценарий обновления

### Если менялся только backend

```bash
cd backend
make deploy-prep
tar -czf auth-service-backend.tar.gz -C dist auth-service-backend
scp auth-service-backend.tar.gz deploy@server:/tmp/
ssh deploy@server 'bash /path/to/deploy_backend.sh /tmp/auth-service-backend.tar.gz'
```

### Если менялся только frontend

```bash
cd frontend
export NEXT_PUBLIC_API_URL=https://auth.example.com/api
export NEXT_PUBLIC_APP_URL=https://auth.example.com
yarn install --immutable
yarn deploy:prep
tar -czf auth-service-frontend.tar.gz -C dist auth-service-frontend
scp auth-service-frontend.tar.gz deploy@server:/tmp/
ssh deploy@server 'bash /path/to/deploy_frontend.sh /tmp/auth-service-frontend.tar.gz'
```

Backend и frontend можно выкатывать независимо.

## Rollback

Так как используется release-based схема, откат сводится к возврату симлинка на прошлую версию.

Посмотреть релизы:

```bash
ls -la /srv/auth-service/releases/backend
ls -la /srv/auth-service/releases/frontend
```

Откат backend:

```bash
sudo ln -sfn /srv/auth-service/releases/backend/<old_timestamp>/auth-service-backend /srv/auth-service/current/backend
sudo systemctl restart auth-service-backend
```

Откат frontend:

```bash
sudo ln -sfn /srv/auth-service/releases/frontend/<old_timestamp>/auth-service-frontend /srv/auth-service/current/frontend
sudo systemctl restart auth-service-frontend
```

Важно:

- откат backend-кода не откатывает схему БД автоматически
- если новый релиз уже применил несовместимую миграцию, rollback нужно планировать отдельно

Поэтому миграции должны быть backward-compatible хотя бы на время выкладки.

## Частые проблемы

### Frontend открылся, но запросы к API идут не туда

Проверьте, с какими значениями был собран frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

Если они были неправильными, исправьте env на этапе build и пересоберите frontend release.

### Backend не стартует из systemd

Проверьте:

- существует ли `/srv/auth-service/current/backend/auth-service`
- заполнен ли `/srv/auth-service/shared/backend/env/backend.env`
- корректен ли `DATABASE_URL`
- есть ли доступ к PostgreSQL

Логи:

```bash
sudo journalctl -u auth-service-backend -f
```

### Frontend не стартует из systemd

Обычно причина одна из этих:

- неправильный путь к `node` в unit-файле
- не существует `/srv/auth-service/current/frontend/server.js`
- порт `3000` уже занят

Логи:

```bash
sudo journalctl -u auth-service-frontend -f
```

### Логин через Discord не возвращает пользователя

Проверьте:

- совпадает ли `DISCORD_REDIRECT_URI` с настройкой в Discord
- входит ли нужный `return_to` в `ALLOWED_RETURN_URLS`
- открыт ли внешний HTTPS-домен

### Миграции не применяются

Backend deploy-скрипт ожидает:

- корректный `DATABASE_URL`
- наличие `migrations/` в архиве
- рабочий бинарник `auth-service-migrator`

Если нужно отдельно прогнать миграции вручную:

```bash
cd /srv/auth-service/current/backend
export $(grep -v '^#' /srv/auth-service/shared/backend/env/backend.env | xargs)
export MIGRATIONS_PATH=/srv/auth-service/current/backend/migrations
./auth-service-migrator
```

## Минимальный чек-лист

1. Подготовить сервер, PostgreSQL, nginx, Node.js.
2. Создать `/srv/auth-service/...`.
3. Заполнить `backend.env` и `frontend.env`.
4. Настроить Discord redirect URL.
5. Установить `systemd` unit-файлы.
6. Собрать backend release.
7. Собрать frontend release с правильными `NEXT_PUBLIC_*`.
8. Загрузить архивы на сервер.
9. Запустить `deploy_backend.sh`.
10. Запустить `deploy_frontend.sh`.
11. Проверить `systemctl`, `journalctl`, `/health` и OAuth flow.

## Связанные документы

- [docs/UPDATE_DATABASE.md](/C:/Users/forkp/WebstormProjects/casino/auth/docs/UPDATE_DATABASE.md)
- [backend/README.md](/C:/Users/forkp/WebstormProjects/casino/auth/backend/README.md)
- [frontend/README.md](/C:/Users/forkp/WebstormProjects/casino/auth/frontend/README.md)
