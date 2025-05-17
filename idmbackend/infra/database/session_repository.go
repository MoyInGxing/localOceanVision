package database

import (
	"github.com/MoyInGxing/idm/domain"
	"gorm.io/gorm"
)

type GORMSessionRepository struct {
	db *gorm.DB
}

func NewGORMSessionRepository(db *gorm.DB) *GORMSessionRepository {
	return &GORMSessionRepository{db: db}
}

func (r *GORMSessionRepository) Create(session *domain.Session) error {
	return r.db.Create(session).Error
}

func (r *GORMSessionRepository) FindByToken(token string) (*domain.Session, error) {
	var session domain.Session
	err := r.db.Where("token = ?", token).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *GORMSessionRepository) Delete(session *domain.Session) error {
	return r.db.Delete(session).Error
}
