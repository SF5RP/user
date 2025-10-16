package main

import (
	"log"
	"os"

	"user-service/internal/config"
	"user-service/internal/database"
	"user-service/internal/handlers"
	"user-service/internal/middleware"
	"user-service/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Настраиваем логгер
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	logger.SetFormatter(&logrus.TextFormatter{})

	// Подключаемся к БД
	db, err := database.ConnectFromEnv()
	if err != nil {
		logger.Fatalf("Failed to connect database: %v", err)
	}
	defer db.Close()

	// Репозитории
	userRepo := database.NewUserRepo(db)
	tokenRepo := database.NewTokenRepo(db)
	characterRepo := database.NewCharacterRepo(db)

	// Создаем сервисы (с БД)
	authService := services.NewAuthService(cfg, logger).WithRepositories(userRepo, tokenRepo)
	characterService := services.NewCharacterService(characterRepo, logger)

	// Создаем обработчики
	authHandler := handlers.NewAuthHandler(authService, logger, cfg)
	userHandler := handlers.NewUserHandler(authService, logger)
	characterHandler := handlers.NewCharacterHandler(characterService, logger)
	statusHandler := handlers.NewStatusHandler(db, cfg, logger)

	// Настраиваем Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Middleware для CORS
	router.Use(middleware.CORS(cfg.FrontendURL))

	// Публичные маршруты
	router.GET("/health", handlers.HealthCheck)
	router.GET("/status", statusHandler.GetDetailedStatus)
	router.GET("/login", authHandler.Login)
	router.GET("/callback", authHandler.Callback)
	router.POST("/refresh", authHandler.Refresh)

	// Защищенные маршруты
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret, logger))
	{
		protected.GET("/me", userHandler.GetMe)

		// Character routes
		protected.POST("/characters", characterHandler.CreateCharacter)
		protected.GET("/characters", characterHandler.GetUserCharacters)
		protected.GET("/characters/:id", characterHandler.GetCharacter)
		protected.PUT("/characters/:id", characterHandler.UpdateCharacter)
		protected.DELETE("/characters/:id", characterHandler.DeleteCharacter)
		protected.GET("/servers/:serverId/characters", characterHandler.GetCharactersByServer)
	}

	// Админские маршруты
	admin := protected.Group("/admin")
	admin.Use(middleware.AdminMiddleware())
	{
		admin.GET("/users", userHandler.GetUsers)
		admin.POST("/users/:id/role", userHandler.UpdateUserRole)
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


