package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"auth-service/internal/config"
	"auth-service/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

type AuthService struct {
	config    *config.Config
	logger    *logrus.Logger
	userRepo  UserRepository
	tokenRepo RefreshTokenRepository

	mutex sync.RWMutex
}

func NewAuthService(cfg *config.Config, logger *logrus.Logger) *AuthService {
	return &AuthService{
		config: cfg,
		logger: logger,
	}
}

// Repositories interfaces
type UserRepository interface {
	UpsertByDiscordID(discordID, username, discriminator, avatar string) (*models.User, error)
	FindByID(id uint) (*models.User, error)
	FindByDiscordID(discordID string) (*models.User, error)
	FindAll() ([]models.User, error)
	UpdateRole(id uint, role string) error
}

type RefreshTokenRepository interface {
	Save(rt *models.RefreshToken) error
	Find(token string) (*models.RefreshToken, error)
}

func (s *AuthService) WithRepositories(userRepo UserRepository, tokenRepo RefreshTokenRepository) *AuthService {
	s.userRepo = userRepo
	s.tokenRepo = tokenRepo
	return s
}

func (s *AuthService) GenerateTokens(user *models.User) (string, string, error) {
	// Access token (15 минут)
	accessClaims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", "", err
	}

	// Refresh token (7 дней)
	refreshTokenBytes := make([]byte, 32)
	if _, err := rand.Read(refreshTokenBytes); err != nil {
		return "", "", err
	}
	refreshTokenString := hex.EncodeToString(refreshTokenBytes)

	// Сохраняем refresh token в БД
	if s.tokenRepo != nil {
		_ = s.tokenRepo.Save(&models.RefreshToken{
			UserID:    user.ID,
			Token:     refreshTokenString,
			ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
			CreatedAt: time.Now(),
		})
	}

	return accessTokenString, refreshTokenString, nil
}

func (s *AuthService) RefreshAccessToken(refreshTokenString string) (string, error) {
	var refreshToken *models.RefreshToken
	var err error

	if s.tokenRepo != nil {
		refreshToken, err = s.tokenRepo.Find(refreshTokenString)
		if err != nil || refreshToken == nil {
			s.logger.Warnf("Refresh token not found: %s", refreshTokenString[:10]+"...")
			return "", fmt.Errorf("invalid refresh token")
		}
	} else {
		return "", fmt.Errorf("token repository not configured")
	}

	if refreshToken.ExpiresAt.Before(time.Now()) {
		s.logger.Warnf("Refresh token expired: %s", refreshTokenString[:10]+"...")
		return "", fmt.Errorf("invalid refresh token")
	}

	// Находим пользователя
	user, err := s.userRepo.FindByID(refreshToken.UserID)
	if user == nil {
		s.logger.Warnf("User not found for refresh token: UserID=%d", refreshToken.UserID)
		return "", fmt.Errorf("user not found")
	}

	s.logger.Infof("Found user for refresh: ID=%d, Username=%s", user.ID, user.Username)

	// Генерируем новый access token
	accessClaims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	return accessToken.SignedString([]byte(s.config.JWTSecret))
}

func (s *AuthService) GenerateAccessTokenByRefreshToken(refreshTokenString string) (string, error) {
	if s.tokenRepo == nil {
		return "", fmt.Errorf("token repository not configured")
	}
	if s.userRepo == nil {
		return "", fmt.Errorf("user repository not configured")
	}

	refreshToken, err := s.tokenRepo.Find(refreshTokenString)
	if err != nil || refreshToken == nil {
		return "", fmt.Errorf("invalid refresh token")
	}
	if refreshToken.ExpiresAt.Before(time.Now()) {
		return "", fmt.Errorf("invalid refresh token")
	}

	user, err := s.userRepo.FindByID(refreshToken.UserID)
	if err != nil || user == nil {
		return "", fmt.Errorf("user not found")
	}

	accessClaims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	return accessToken.SignedString([]byte(s.config.JWTSecret))
}

func (s *AuthService) CreateOrUpdateUser(discordID, username, discriminator, avatar string) (*models.User, error) {
	if s.userRepo == nil {
		return nil, fmt.Errorf("user repository not configured")
	}
	user, err := s.userRepo.UpsertByDiscordID(discordID, username, discriminator, avatar)
	if err != nil {
		return nil, err
	}

	// Auto-promote to admin if discordID is in configured list
	if len(s.config.AdminDiscordIDs) > 0 && user.Role != "admin" {
		for _, adminID := range s.config.AdminDiscordIDs {
			if adminID == discordID {
				if err := s.userRepo.UpdateRole(user.ID, "admin"); err != nil {
					s.logger.WithError(err).Warnf("failed to promote user %s to admin", discordID)
				} else {
					user.Role = "admin"
				}
				break
			}
		}
	}

	return user, nil
}

func (s *AuthService) GetUserService() *UserService {
	return &UserService{
		logger:   s.logger,
		userRepo: s.userRepo,
		mutex:    &s.mutex,
	}
}

func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	if s.userRepo == nil {
		return nil, fmt.Errorf("user repository not configured")
	}
	return s.userRepo.FindByID(id)
}

func (s *AuthService) GetAllUsers() []models.User {
	if s.userRepo == nil {
		return []models.User{}
	}
	users, err := s.userRepo.FindAll()
	if err != nil {
		s.logger.WithError(err).Warn("failed to load users")
		return []models.User{}
	}
	return users
}

func (s *AuthService) UpdateUserRole(id uint, role string) error {
	validRoles := map[string]bool{
		"user":      true,
		"moderator": true,
		"admin":     true,
	}
	if !validRoles[role] {
		return fmt.Errorf("invalid role")
	}
	return s.userRepo.UpdateRole(id, role)
}

