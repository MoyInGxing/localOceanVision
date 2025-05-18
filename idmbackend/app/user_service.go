package app

import (
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
	existingUser, _ := s.userRepo.FindByUsername(username)
	if existingUser != nil {
		return nil, domain.ErrUserAlreadyExists
	}

	user := &domain.User{Username: username}
	if err := user.SetPassword(password); err != nil {
		return nil, err
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) GetUserByID(id uint) (*domain.User, error) {
	return s.userRepo.FindByID(id)
}
