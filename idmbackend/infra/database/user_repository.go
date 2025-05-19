package database

import (
	"log"

	"github.com/MoyInGxing/idm/domain"
	"gorm.io/gorm"
)

type GORMUserRepository struct {
	db *gorm.DB
}

func NewGORMUserRepository(db *gorm.DB) *GORMUserRepository {
	return &GORMUserRepository{db: db}
}

func (r *GORMUserRepository) Create(user *domain.User) error {
	log.Printf("正在创建用户: %+v", user)
	err := r.db.Create(user).Error
	if err != nil {
		log.Printf("创建用户失败: %v", err)
		return err
	}
	log.Printf("用户创建成功，ID: %d", user.ID)
	return nil
}

func (r *GORMUserRepository) FindByUsername(username string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *GORMUserRepository) FindByID(id uint) (*domain.User, error) {
	var user domain.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
