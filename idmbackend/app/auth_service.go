package app

import (
	"github.com/MoyInGxing/idm/config"
	"github.com/MoyInGxing/idm/domain"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type SessionRepository interface {
	Create(session *domain.Session) error
	FindByToken(token string) (*domain.Session, error)
	Delete(session *domain.Session) error
}

type AuthService struct {
	userRepo    UserRepository
	sessionRepo SessionRepository
	cfg         *config.Config
}

func NewAuthService(userRepo UserRepository, sessionRepo SessionRepository, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, sessionRepo: sessionRepo, cfg: cfg}
}

func (s *AuthService) Login(username, password string) (string, *domain.User, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	if err := user.ComparePassword(password); err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.generateToken(user.ID, user.Role)
	if err != nil {
		return "", nil, err
	}

	// Store session (optional, depending on your SSO strategy)
	session := &domain.Session{
		UserID: user.ID,
		Token:  token,
		Expiry: time.Now().Add(s.cfg.SessionExpiry),
	}
	if err := s.sessionRepo.Create(session); err != nil {
		// Log the error, but don't necessarily fail the login
		println("Error creating session:", err.Error())
	}

	return token, user, nil
}

func (s *AuthService) VerifyToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, domain.ErrInvalidToken
		}
		return []byte(s.cfg.JWTSignatureKey), nil
	})
	if err != nil {
		return nil, err
	}
	return token, nil
}

func (s *AuthService) GetUserIDFromToken(token *jwt.Token) (uint, error) {
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			return 0, domain.ErrInvalidTokenClaims
		}
		return uint(userIDFloat), nil
	}
	return 0, domain.ErrInvalidToken
}

func (s *AuthService) GetUserRoleFromToken(token *jwt.Token) (domain.Role, error) {
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		role, ok := claims["role"].(string)
		if !ok {
			return "", domain.ErrInvalidTokenClaims
		}
		return domain.Role(role), nil
	}
	return "", domain.ErrInvalidToken
}

func (s *AuthService) generateToken(userID uint, role domain.Role) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(s.cfg.TokenExpiry).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(s.cfg.JWTSignatureKey))
	return signedToken, err
}

// Single Sign-On (SSO) Verification (Illustrative - depends on your SSO implementation)
func (s *AuthService) VerifySSOToken(ssoToken string) (uint, error) {
	// In a real SSO scenario, you would interact with the SSO provider
	// to validate the ssoToken and retrieve the user's identity.
	// For this example, we'll just simulate it.
	if ssoToken == "valid_sso_token_for_user_123" {
		return 123, nil // Simulate successful SSO authentication for user ID 123
	}
	return 0, domain.ErrInvalidSSOToken
}
