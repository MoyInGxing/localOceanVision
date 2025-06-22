package app

import (
	"log"

	"github.com/MoyInGxing/idm/domain"
)

type UserRepository interface {
	Create(user *domain.User) error
	FindByUsername(username string) (*domain.User, error)
	FindByID(id uint) (*domain.User, error)
	FindAll() ([]*domain.User, error)
	Delete(userID string) error
	UpdateRole(userID string, role domain.Role) error
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

// GetAllUsers 获取所有用户
func (s *UserService) GetAllUsers() ([]*domain.User, error) {
	return s.userRepo.FindAll()
}

// DeleteUser 删除用户
func (s *UserService) DeleteUser(userID string) error {
	return s.userRepo.Delete(userID)
}

// UpdateUserRole 更新用户角色
func (s *UserService) UpdateUserRole(userID string, role domain.Role) error {
	return s.userRepo.UpdateRole(userID, role)
}

// ValidateUser 验证用户登录
func (s *UserService) ValidateUser(username, password string) (*domain.User, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domain.ErrInvalidCredentials
	}

	if err := user.ComparePassword(password); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	return user, nil
}
