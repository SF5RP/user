package database

import (
	"auth-service/internal/models"
)

type TokenRepo struct {
	db *DB
}

func NewTokenRepo(db *DB) *TokenRepo { return &TokenRepo{db: db} }

func (r *TokenRepo) Save(rt *models.RefreshToken) error {
	_, err := r.db.SQL.Exec(`
		INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (token) DO NOTHING
	`, rt.UserID, rt.Token, rt.ExpiresAt, rt.CreatedAt)
	return err
}

func (r *TokenRepo) Find(token string) (*models.RefreshToken, error) {
	var rt models.RefreshToken
	err := r.db.SQL.QueryRow(`SELECT id, user_id, token, expires_at, created_at FROM refresh_tokens WHERE token=$1`, token).
		Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &rt, nil
}


