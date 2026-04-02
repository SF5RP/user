package database

import (
	"auth-service/internal/models"
)

type UserRepo struct {
	db *DB
}

func NewUserRepo(db *DB) *UserRepo { return &UserRepo{db: db} }

func (r *UserRepo) UpsertByDiscordID(discordID, username, discriminator, avatar string) (*models.User, error) {
	var u models.User
	// Upsert by discord_id
	query := `
		INSERT INTO users (discord_id, username, discriminator, avatar)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (discord_id) DO UPDATE SET username = EXCLUDED.username, discriminator = EXCLUDED.discriminator, avatar = EXCLUDED.avatar
		RETURNING id, discord_id, username, discriminator, avatar, role, created_at
	`
	err := r.db.SQL.QueryRow(query, discordID, username, discriminator, avatar).Scan(&u.ID, &u.DiscordID, &u.Username, &u.Discriminator, &u.Avatar, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByID(id uint) (*models.User, error) {
	var u models.User
	err := r.db.SQL.QueryRow(`SELECT id, discord_id, username, discriminator, avatar, role, created_at FROM users WHERE id=$1`, id).
		Scan(&u.ID, &u.DiscordID, &u.Username, &u.Discriminator, &u.Avatar, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindAll() ([]models.User, error) {
	rows, err := r.db.SQL.Query(`SELECT id, discord_id, username, discriminator, avatar, role, created_at FROM users ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.DiscordID, &u.Username, &u.Discriminator, &u.Avatar, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserRepo) FindByDiscordID(discordID string) (*models.User, error) {
	var u models.User
	err := r.db.SQL.QueryRow(`SELECT id, discord_id, username, discriminator, avatar, role, created_at FROM users WHERE discord_id=$1`, discordID).
		Scan(&u.ID, &u.DiscordID, &u.Username, &u.Discriminator, &u.Avatar, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) UpdateRole(id uint, role string) error {
	_, err := r.db.SQL.Exec(`UPDATE users SET role=$1 WHERE id=$2`, role, id)
	return err
}

