package middleware

import (
	"github.com/gin-gonic/gin"
	"strings"
	"log"
)

type AuthMiddleware struct {
	// 可以添加依赖项，比如数据库连接等
}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{}
}

func (m *AuthMiddleware) Handle() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取 token
		authHeader := c.GetHeader("Authorization")
		log.Printf("收到请求，Authorization 头: %s", authHeader)

		if authHeader == "" {
			log.Printf("未提供认证令牌")
			c.JSON(401, gin.H{"error": "未提供认证令牌"})
			c.Abort()
			return
		}

		// 检查 token 格式
		parts := strings.Split(authHeader, " ")
		log.Printf("token 部分: %v", parts)

		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("无效的认证令牌格式")
			c.JSON(401, gin.H{"error": "无效的认证令牌格式"})
			c.Abort()
			return
		}

		token := parts[1]
		if token == "" {
			log.Printf("无效的认证令牌")
			c.JSON(401, gin.H{"error": "无效的认证令牌"})
			c.Abort()
			return
		}

		log.Printf("验证 token: %s", token)

		// 简单的 token 验证
		// 在实际应用中，这里应该使用 JWT 验证或其他验证方式
		if !strings.HasPrefix(token, "test_token_") {
			log.Printf("无效的 token 格式")
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// 从 token 中提取用户名
		username := strings.TrimPrefix(token, "test_token_")
		log.Printf("从 token 中提取的用户名: %s", username)

		// 将用户信息存储在上下文中
		c.Set("userID", "test_user_id")
		c.Set("userRole", "user")
		c.Set("username", username)

		log.Printf("认证成功，用户ID: test_user_id, 角色: user, 用户名: %s", username)
		c.Next()
	}
} 