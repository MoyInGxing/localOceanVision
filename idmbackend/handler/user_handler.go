package handler

import (
	"log"
	"net/http"

	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/domain"
	"github.com/gin-gonic/gin"
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
	var request struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	// 使用UserService创建新用户
	user, err := h.userService.RegisterUser(request.Username, request.Password)
	if err != nil {
		if err == domain.ErrUserAlreadyExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
			return
		}
		log.Printf("注册失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败，请稍后重试"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}

func (h *UserHandler) Login(c *gin.Context) {
	var request struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	// 从数据库验证用户
	user, err := h.userService.ValidateUser(request.Username, request.Password)
	if err != nil {
		if err == domain.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "登录失败，请稍后重试"})
		return
	}

	// 生成JWT token
	token, err := h.authService.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	// 从上下文中获取用户信息
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	// 获取用户角色和用户名
	userRole, _ := c.Get("userRole")
	username, _ := c.Get("username")

	// 返回用户信息
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":       userID,
			"username": username,
			"role":     userRole,
		},
	})
}

func (h *UserHandler) GetAdminDashboard(c *gin.Context) {
	// 从上下文中获取用户角色
	userRole, exists := c.Get("userRole")
	if !exists {
		log.Printf("管理员仪表板 - 未找到用户角色")
		c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
		return
	}

	log.Printf("管理员仪表板 - 当前用户角色: %v", userRole)

	// 检查是否是管理员
	if userRole != "admin" {
		log.Printf("管理员仪表板 - 用户角色不是管理员: %v", userRole)
		c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
		return
	}

	log.Printf("管理员仪表板 - 访问成功")

	// TODO: 实现实际的管理员仪表板数据获取逻辑
	c.JSON(http.StatusOK, gin.H{
		"message": "管理员仪表板数据",
		"data": gin.H{
			"totalUsers":  100,
			"activeUsers": 50,
		},
	})
}

// GetAllUsers 获取所有用户
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	log.Printf("开始获取用户列表")

	users, err := h.userService.GetAllUsers()
	if err != nil {
		log.Printf("获取用户列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	log.Printf("成功获取到 %d 个用户", len(users))

	userDTOs := make([]UserDTO, len(users))
	for i, user := range users {
		userDTOs[i] = UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Role:     user.Role,
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": userDTOs})
}

// DeleteUser 删除用户
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不能为空"})
		return
	}

	err := h.userService.DeleteUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "用户删除成功"})
}

// UpdateUserRole 更新用户角色
func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不能为空"})
		return
	}

	var request struct {
		Role domain.Role `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	err := h.userService.UpdateUserRole(userID, request.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户角色失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "用户角色更新成功"})
}
