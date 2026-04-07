package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DiscordClientID     string
	DiscordClientSecret string
	DiscordRedirectURI  string
	FrontendURL         string
	AllowedOrigins      []string
	AllowedReturnURLs   []string
	JWTSecret           string
	ServerPort          string
	Environment         string
	AdminDiscordIDs     []string
	DatabaseURL         string
}

func Load() (*Config, error) {
	// Загружаем .env файл если он существует
	godotenv.Load("config.env")

	cfg := &Config{
		DiscordClientID:     getEnv("DISCORD_CLIENT_ID", ""),
		DiscordClientSecret: getEnv("DISCORD_CLIENT_SECRET", ""),
		DiscordRedirectURI:  getEnv("DISCORD_REDIRECT_URI", "http://localhost:8080/api/callback"),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		JWTSecret:           getEnv("JWT_SECRET", "default-secret-key"),
		ServerPort:          getEnv("SERVER_PORT", "8080"),
		Environment:         getEnv("ENVIRONMENT", "development"),
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://authuser:userpassword@127.0.0.1:5432/userdb?sslmode=disable"),
	}

	if urls := getEnv("ALLOWED_RETURN_URLS", ""); urls != "" {
		parts := strings.Split(urls, ",")
		cleaned := make([]string, 0, len(parts))
		for _, p := range parts {
			v := strings.TrimSpace(p)
			if v != "" {
				cleaned = append(cleaned, v)
			}
		}
		cfg.AllowedReturnURLs = cleaned
	} else {
		cfg.AllowedReturnURLs = []string{}
	}

	if origins := getEnv("ALLOWED_ORIGINS", ""); origins != "" {
		parts := strings.Split(origins, ",")
		cleaned := make([]string, 0, len(parts))
		for _, p := range parts {
			v := strings.TrimSpace(p)
			if v != "" {
				cleaned = append(cleaned, v)
			}
		}
		cfg.AllowedOrigins = cleaned
	} else if cfg.FrontendURL != "" {
		cfg.AllowedOrigins = []string{cfg.FrontendURL}
	} else {
		cfg.AllowedOrigins = []string{}
	}

	if ids := getEnv("ADMIN_DISCORD_IDS", ""); ids != "" {
		// Split by comma and trim spaces
		parts := strings.Split(ids, ",")
		cleaned := make([]string, 0, len(parts))
		for _, p := range parts {
			v := strings.TrimSpace(p)
			if v != "" {
				cleaned = append(cleaned, v)
			}
		}
		cfg.AdminDiscordIDs = cleaned
	} else {
		cfg.AdminDiscordIDs = []string{}
	}

	// Валидация обязательных переменных окружения
	if cfg.DiscordClientID == "" || cfg.DiscordClientSecret == "" || cfg.DiscordRedirectURI == "" {
		return nil, fmt.Errorf("missing required env vars: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI")
	}
	if cfg.JWTSecret == "default-secret-key" {
		// Разрешаем для dev, но логируем предупреждение через stdout, чтобы не тянуть сюда логгер
		_ = os.Setenv("JWT_SECRET_WARNING", "USING_DEFAULT_JWT_SECRET")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
