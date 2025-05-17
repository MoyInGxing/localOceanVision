package handler

import (
	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/domain"
	"github.com/gin-gonic/gin"
	"net/http"
)

type UserHandler struct {
	userService *app.UserService
	authService *app.AuthService
}

func NewUserHandler(us *app.UserService, as *app.AuthService) *UserHandler {
	return &UserHandler{userService: us, authService: as}
}

type RegistrationRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string   `json:"token"`
	User  *UserDTO `json:"user"`
}

type UserDTO struct {
	ID       uint        `json:"id"`
	Username string      `json:"username"`
	Role     domain.Role `json:"role"`
}

func (h *UserHandler) Register(c *gin.Context) {
	var req RegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.RegisterUser(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user_id": user.ID})
}

func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	userDTO := &UserDTO{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}

	c.JSON(http.StatusOK, LoginResponse{Token: token, User: userDTO})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user profile"})
		return
	}

	userDTO := &UserDTO{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}

	c.JSON(http.StatusOK, gin.H{"user": userDTO})
}
