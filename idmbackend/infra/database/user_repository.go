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

// FindAll 获取所有用户
func (r *GORMUserRepository) FindAll() ([]*domain.User, error) {
	var users []*domain.User
	err := r.db.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

// Delete 删除用户
func (r *GORMUserRepository) Delete(userID string) error {
	return r.db.Delete(&domain.User{}, userID).Error
}

// UpdateRole 更新用户角色
func (r *GORMUserRepository) UpdateRole(userID string, role domain.Role) error {
	return r.db.Model(&domain.User{}).Where("id = ?", userID).Update("role", role).Error
}
