package services

import (
	"fmt"
	"sync"

	"auth-service/internal/models"

	"github.com/sirupsen/logrus"
)

type UserService struct {
    logger  *logrus.Logger
    userRepo UserRepository
    mutex   *sync.RWMutex
}

func NewUserService(logger *logrus.Logger, userRepo UserRepository) *UserService {
    return &UserService{
        logger:  logger,
        userRepo: userRepo,
        mutex:   &sync.RWMutex{},
    }
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
    return s.userRepo.FindByID(id)
}

func (s *UserService) GetAllUsers() ([]models.User, error) {
    return s.userRepo.FindAll()
}

func (s *UserService) UpdateUserRole(id uint, role string) error {
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

func (s *UserService) SyncAdminRoles(adminDiscordIDs []string) error {
    s.mutex.Lock()
    defer s.mutex.Unlock()
    
    for _, discordID := range adminDiscordIDs {
        user, err := s.userRepo.FindByDiscordID(discordID)
        if err != nil {
            // Пользователь не найден - это нормально, он может еще не зарегистрироваться
            s.logger.WithField("discord_id", discordID).Debug("Admin user not found in database")
            continue
        }
        
        if user.Role != "admin" {
            s.logger.WithFields(logrus.Fields{
                "user_id": user.ID,
                "discord_id": discordID,
                "username": user.Username,
                "old_role": user.Role,
                "new_role": "admin",
            }).Info("Updating user role to admin based on Discord ID")
            
            if err := s.userRepo.UpdateRole(user.ID, "admin"); err != nil {
                s.logger.WithError(err).WithField("user_id", user.ID).Error("Failed to update user role to admin")
                return fmt.Errorf("failed to update user %d role to admin: %w", user.ID, err)
            }
        }
    }
    
    return nil
}
