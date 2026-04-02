package models

import "time"

type User struct {
	ID            uint      `json:"id"`
	DiscordID     string    `json:"discord_id"`
	Username      string    `json:"username"`
	Discriminator string    `json:"discriminator"`
	Avatar        string    `json:"avatar"`
	Role          string    `json:"role"`
	CreatedAt     time.Time `json:"created_at"`
}

type RefreshToken struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
