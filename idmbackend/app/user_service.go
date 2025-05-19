package app

import (
	"log"

	"github.com/MoyInGxing/idm/domain"
)

type UserRepository interface {
	Create(user *domain.User) error
	FindByUsername(username string) (*domain.User, error)
	FindByID(id uint) (*domain.User, error)
}

type UserService struct {
	userRepo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{userRepo: repo}
}

func (s *UserService) RegisterUser(username, password string) (*domain.User, error) {
	log.Printf("开始注册用户: %s", username)

	existingUser, err := s.userRepo.FindByUsername(username)
	if err != nil {
		log.Printf("检查用户名是否存在时出错: %v", err)
		return nil, err
	}
	if existingUser != nil {
		log.Printf("用户名已存在: %s", username)
		return nil, domain.ErrUserAlreadyExists
	}

	user := &domain.User{
		Username: username,
		Role:     domain.RoleUser,
	}
	if err := user.SetPassword(password); err != nil {
		log.Printf("设置密码时出错: %v", err)
		return nil, err
	}

	if err := s.userRepo.Create(user); err != nil {
		log.Printf("创建用户时出错: %v", err)
		return nil, err
	}

	log.Printf("用户注册成功: %s, ID: %d", username, user.ID)
	return user, nil
}

func (s *UserService) GetUserByID(id uint) (*domain.User, error) {
	return s.userRepo.FindByID(id)
}
