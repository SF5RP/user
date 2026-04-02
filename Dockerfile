# Используем официальный образ Go
FROM golang:1.24-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем go.mod и go.sum из backend
COPY backend/go.mod backend/go.sum ./

# Загружаем зависимости
RUN go mod download

# Копируем backend исходный код
COPY backend/ .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./main.go

# Собираем мигратор
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o migrator ./cmd/migrator

# Используем минимальный образ для запуска
FROM alpine:latest

# Обновляем индекс пакетов и устанавливаем ca-certificates для HTTPS запросов
RUN apk update && apk --no-cache add ca-certificates

WORKDIR /root/

# Копируем собранное приложение
COPY --from=builder /app/main .
COPY --from=builder /app/migrator .

# Копируем миграции
COPY --from=builder /app/migrations ./migrations

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["./main"]