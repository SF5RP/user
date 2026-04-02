package handlers

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"time"

	"auth-service/internal/config"
	"auth-service/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type StatusHandler struct {
	db     *database.DB
	cfg    *config.Config
	logger *logrus.Logger
}

func NewStatusHandler(db *database.DB, cfg *config.Config, logger *logrus.Logger) *StatusHandler {
	return &StatusHandler{
		db:     db,
		cfg:    cfg,
		logger: logger,
	}
}

type SystemStatus struct {
	Status      string                 `json:"status"`
	Timestamp   time.Time              `json:"timestamp"`
	Service     string                 `json:"service"`
	Version     string                 `json:"version"`
	Environment string                 `json:"environment"`
	Components  map[string]Component   `json:"components"`
	System      SystemInfo             `json:"system"`
	Config      ConfigInfo             `json:"config"`
}

type Component struct {
	Status      string        `json:"status"`
	Message     string        `json:"message,omitempty"`
	ResponseTime time.Duration `json:"response_time_ms,omitempty"`
	Details     interface{}   `json:"details,omitempty"`
}

type SystemInfo struct {
	GoVersion    string `json:"go_version"`
	OS           string `json:"os"`
	Architecture string `json:"architecture"`
	NumCPU       int    `json:"num_cpu"`
	NumGoroutine int    `json:"num_goroutine"`
	Memory       MemoryInfo `json:"memory"`
}

type MemoryInfo struct {
	Alloc      uint64 `json:"alloc_bytes"`
	TotalAlloc uint64 `json:"total_alloc_bytes"`
	Sys        uint64 `json:"sys_bytes"`
	NumGC      uint32 `json:"num_gc"`
}

type ConfigInfo struct {
	DiscordClientID     string   `json:"discord_client_id"`
	DiscordRedirectURI  string   `json:"discord_redirect_uri"`
	FrontendURL         string   `json:"frontend_url"`
	ServerPort          string   `json:"server_port"`
	Environment         string   `json:"environment"`
	HasJWTSecret        bool     `json:"has_jwt_secret"`
	AdminCount          int      `json:"admin_count"`
	AdminDiscordIDs     []string `json:"admin_discord_ids"`
}

func (h *StatusHandler) GetDetailedStatus(c *gin.Context) {
	startTime := time.Now()
	status := &SystemStatus{
		Status:      "ok",
		Timestamp:   time.Now(),
		Service:     "auth-service",
		Version:     "1.0.0", // Можно получать из git или переменной окружения
		Environment: h.cfg.Environment,
		Components:  make(map[string]Component),
	}

	// Проверяем компоненты параллельно
	components := make(chan ComponentResult, 4)
	
	go h.checkDatabase(components)
	go h.checkDiscordAPI(components)
	go h.checkFrontend(components)
	go h.checkSystemHealth(components)

	// Собираем результаты
	for i := 0; i < 4; i++ {
		result := <-components
		status.Components[result.Name] = result.Component
		
		// Если какой-то компонент не работает, общий статус становится "degraded"
		if result.Component.Status == "error" {
			status.Status = "degraded"
		}
	}

	// Добавляем системную информацию
	status.System = h.getSystemInfo()
	
	// Добавляем информацию о конфигурации
	status.Config = h.getConfigInfo()

	// Определяем HTTP статус код
	httpStatus := http.StatusOK
	if status.Status == "degraded" {
		httpStatus = http.StatusServiceUnavailable
	}

	// Добавляем время выполнения
	status.Components["overall"] = Component{
		Status:       status.Status,
		ResponseTime: time.Since(startTime),
		Message:      fmt.Sprintf("Status check completed in %v", time.Since(startTime)),
	}

	c.JSON(httpStatus, status)
}

type ComponentResult struct {
	Name     string
	Component Component
}

func (h *StatusHandler) checkDatabase(ch chan<- ComponentResult) {
	start := time.Now()
	component := Component{}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Проверяем подключение к БД
	if h.db == nil || h.db.SQL == nil {
		component.Status = "error"
		component.Message = "Database connection not initialized"
		component.ResponseTime = time.Since(start)
		ch <- ComponentResult{Name: "database", Component: component}
		return
	}

	if err := h.db.SQL.PingContext(ctx); err != nil {
		component.Status = "error"
		component.Message = fmt.Sprintf("Database connection failed: %v", err)
		component.ResponseTime = time.Since(start)
	} else {
		// Проверяем базовые таблицы
		var count int
		err := h.db.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
		if err != nil {
			component.Status = "error"
			component.Message = fmt.Sprintf("Database query failed: %v", err)
		} else {
			component.Status = "ok"
			component.Message = "Database is healthy"
			component.Details = map[string]interface{}{
				"user_count": count,
				"connection": "active",
			}
		}
		component.ResponseTime = time.Since(start)
	}

	ch <- ComponentResult{Name: "database", Component: component}
}

func (h *StatusHandler) checkDiscordAPI(ch chan<- ComponentResult) {
	start := time.Now()
	component := Component{}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Проверяем доступность Discord API
	req, err := http.NewRequestWithContext(ctx, "GET", "https://discord.com/api/v10/gateway", nil)
	if err != nil {
		component.Status = "error"
		component.Message = fmt.Sprintf("Failed to create Discord API request: %v", err)
		component.ResponseTime = time.Since(start)
		ch <- ComponentResult{Name: "discord", Component: component}
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		component.Status = "error"
		component.Message = fmt.Sprintf("Discord API unreachable: %v", err)
		component.ResponseTime = time.Since(start)
		ch <- ComponentResult{Name: "discord", Component: component}
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		component.Status = "ok"
		component.Message = "Discord API is accessible"
		component.Details = map[string]interface{}{
			"status_code": resp.StatusCode,
			"url":         "https://discord.com/api/v10/gateway",
		}
	} else {
		component.Status = "error"
		component.Message = fmt.Sprintf("Discord API returned status %d", resp.StatusCode)
		component.Details = map[string]interface{}{
			"status_code": resp.StatusCode,
		}
	}
	component.ResponseTime = time.Since(start)

	ch <- ComponentResult{Name: "discord", Component: component}
}

func (h *StatusHandler) checkFrontend(ch chan<- ComponentResult) {
	start := time.Now()
	component := Component{}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Проверяем доступность фронтенда
	req, err := http.NewRequestWithContext(ctx, "GET", h.cfg.FrontendURL+"/health", nil)
	if err != nil {
		component.Status = "error"
		component.Message = fmt.Sprintf("Failed to create frontend request: %v", err)
		component.ResponseTime = time.Since(start)
		ch <- ComponentResult{Name: "frontend", Component: component}
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		component.Status = "error"
		component.Message = fmt.Sprintf("Frontend unreachable: %v", err)
		component.ResponseTime = time.Since(start)
		ch <- ComponentResult{Name: "frontend", Component: component}
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		component.Status = "ok"
		component.Message = "Frontend is accessible"
		component.Details = map[string]interface{}{
			"status_code": resp.StatusCode,
			"url":         h.cfg.FrontendURL,
		}
	} else {
		component.Status = "warning"
		component.Message = fmt.Sprintf("Frontend returned status %d", resp.StatusCode)
		component.Details = map[string]interface{}{
			"status_code": resp.StatusCode,
			"url":         h.cfg.FrontendURL,
		}
	}
	component.ResponseTime = time.Since(start)

	ch <- ComponentResult{Name: "frontend", Component: component}
}

func (h *StatusHandler) checkSystemHealth(ch chan<- ComponentResult) {
	start := time.Now()
	component := Component{}

	// Проверяем системные ресурсы
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Простая проверка на критическое использование памяти
	memoryUsagePercent := float64(m.Alloc) / float64(m.Sys) * 100
	
	if memoryUsagePercent > 90 {
		component.Status = "warning"
		component.Message = fmt.Sprintf("High memory usage: %.2f%%", memoryUsagePercent)
	} else {
		component.Status = "ok"
		component.Message = "System resources are healthy"
	}

	component.Details = map[string]interface{}{
		"memory_usage_percent": memoryUsagePercent,
		"goroutines":           runtime.NumGoroutine(),
		"gc_runs":              m.NumGC,
	}
	component.ResponseTime = time.Since(start)

	ch <- ComponentResult{Name: "system", Component: component}
}

func (h *StatusHandler) getSystemInfo() SystemInfo {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return SystemInfo{
		GoVersion:    runtime.Version(),
		OS:           runtime.GOOS,
		Architecture: runtime.GOARCH,
		NumCPU:       runtime.NumCPU(),
		NumGoroutine: runtime.NumGoroutine(),
		Memory: MemoryInfo{
			Alloc:      m.Alloc,
			TotalAlloc: m.TotalAlloc,
			Sys:        m.Sys,
			NumGC:      m.NumGC,
		},
	}
}

func (h *StatusHandler) getConfigInfo() ConfigInfo {
	return ConfigInfo{
		DiscordClientID:    maskSensitive(h.cfg.DiscordClientID),
		DiscordRedirectURI: h.cfg.DiscordRedirectURI,
		FrontendURL:        h.cfg.FrontendURL,
		ServerPort:         h.cfg.ServerPort,
		Environment:        h.cfg.Environment,
		HasJWTSecret:       h.cfg.JWTSecret != "default-secret-key",
		AdminCount:         len(h.cfg.AdminDiscordIDs),
		AdminDiscordIDs:    h.cfg.AdminDiscordIDs,
	}
}

// maskSensitive маскирует чувствительную информацию для безопасности
func maskSensitive(value string) string {
	if len(value) <= 8 {
		return "***"
	}
	return value[:4] + "***" + value[len(value)-4:]
}
