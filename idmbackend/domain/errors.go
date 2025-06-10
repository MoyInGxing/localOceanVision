package domain

import "errors"

var (
	ErrUserAlreadyExists  = errors.New("user with this username already exists")
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidToken       = errors.New("invalid token")
	ErrInvalidTokenClaims = errors.New("invalid token claims")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidSSOToken    = errors.New("invalid SSO token")
	// Add more domain-specific errors as needed
)
