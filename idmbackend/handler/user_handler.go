package handler

import (
	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/domain"
	"github.com/gin-gonic/gin"
	"net/http"
	"log"
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
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	// TODO: 实现实际的注册逻辑
	// 这里应该添加用户创建、密码加密等逻辑

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"user": gin.H{
			"username": request.Username,
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

	// 生成一个简单的测试 token
	// 在实际应用中，这里应该使用 JWT 或其他 token 生成方式
	testToken := "test_token_" + request.Username

	// 检查是否是管理员账号
	role := "user"
	if request.Username == "admin" && request.Password == "admin123" {
		role = "admin"
		log.Printf("管理员登录成功，设置角色为: %s", role)
	}

	c.JSON(http.StatusOK, gin.H{
		"token": testToken,
		"user": gin.H{
			"id":       1,
			"username": request.Username,
			"role":     role,
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
			"totalUsers": 100,
			"activeUsers": 50,
		},
	})
}
