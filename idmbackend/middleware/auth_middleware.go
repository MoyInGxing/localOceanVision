package middleware

import (
	"strings"

	"github.com/MoyInGxing/idm/app"
	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	authService *app.AuthService
}

func NewAuthMiddleware(authService *app.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

func (m *AuthMiddleware) Handle() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "未提供认证信息"})
			c.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || strings.ToLower(tokenParts[0]) != "bearer" {
			c.JSON(401, gin.H{"error": "无效的认证格式"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		token, err := m.authService.VerifyToken(tokenString)
		if err != nil {
			c.JSON(401, gin.H{"error": "无效的token"})
			c.Abort()
			return
		}

		userID, err := m.authService.GetUserIDFromToken(token)
		if err != nil {
			c.JSON(401, gin.H{"error": "无效的token信息"})
			c.Abort()
			return
		}

		role, err := m.authService.GetUserRoleFromToken(token)
		if err != nil {
			c.JSON(401, gin.H{"error": "无效的token信息"})
			c.Abort()
			return
		}

		// 将用户信息存储在上下文中
		c.Set("userID", userID)
		c.Set("userRole", role)

		c.Next()
	}
}
