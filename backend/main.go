package main

import (
	"fmt"
	"log"
	"os"

	"auth-service/internal/config"
	"auth-service/internal/database"
	"auth-service/internal/handlers"
	"auth-service/internal/middleware"
	"auth-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}
	
	// Отладочный вывод
	fmt.Printf("Database URL: %s\n", cfg.DatabaseURL)

	// Настраиваем логгер
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	logger.SetFormatter(&logrus.TextFormatter{})

	// Подключаемся к БД
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect database: %v", err)
	}
	defer db.Close()

	// Репозитории
	userRepo := database.NewUserRepo(db)
	tokenRepo := database.NewTokenRepo(db)

	// Создаем сервисы (с БД)
	authService := services.NewAuthService(cfg, logger).WithRepositories(userRepo, tokenRepo)
	userService := services.NewUserService(logger, userRepo)

	// Синхронизируем роли админов при запуске
	if err := userService.SyncAdminRoles(cfg.AdminDiscordIDs); err != nil {
		logger.WithError(err).Warn("Failed to sync admin roles on startup")
	} else {
		logger.WithField("admin_count", len(cfg.AdminDiscordIDs)).Info("Admin roles synchronized successfully")
	}

	// Создаем обработчики
	authHandler := handlers.NewAuthHandler(authService, logger, cfg)
	userHandler := handlers.NewUserHandler(authService, logger)
	statusHandler := handlers.NewStatusHandler(db, cfg, logger)

	// Настраиваем Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Middleware для CORS
	router.Use(middleware.CORS(cfg.AllowedOrigins))

	// Health check endpoint (no /api prefix for monitoring)
	router.GET("/health", handlers.HealthCheck)

	// API routes with /api prefix
	api := router.Group("/api")
	{
		// Публичные API маршруты
		api.GET("/status", statusHandler.GetDetailedStatus)
		api.GET("/login", authHandler.Login)
		api.GET("/callback", authHandler.Callback)
		api.POST("/refresh", authHandler.Refresh)

		// Защищенные API маршруты
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret, logger))
		{
			protected.GET("/me", userHandler.GetMe)
		}

		// Админские API маршруты
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", userHandler.GetUsers)
			admin.POST("/users/:id/role", userHandler.UpdateUserRole)
		}
	}

	// Запускаем сервер
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	logger.Infof("Starting server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Failed to start server:", err)
	}
}
