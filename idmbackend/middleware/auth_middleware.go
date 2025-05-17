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
		// 打印所有请求头，用于调试
		log.Printf("认证中间件 - 所有请求头: %v", c.Request.Header)

		// 从请求头获取 token
		authHeader := c.GetHeader("Authorization")
		log.Printf("认证中间件 - 收到请求，Authorization 头: %s", authHeader)

		if authHeader == "" {
			log.Printf("认证中间件 - 未提供认证令牌")
			c.JSON(401, gin.H{"error": "未提供认证令牌"})
			c.Abort()
			return
		}

		// 检查 token 格式
		parts := strings.Split(authHeader, " ")
		log.Printf("认证中间件 - token 部分: %v", parts)

		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("认证中间件 - 无效的认证令牌格式")
			c.JSON(401, gin.H{"error": "无效的认证令牌格式"})
			c.Abort()
			return
		}

		token := parts[1]
		if token == "" {
			log.Printf("认证中间件 - 无效的认证令牌")
			c.JSON(401, gin.H{"error": "无效的认证令牌"})
			c.Abort()
			return
		}

		log.Printf("认证中间件 - 验证 token: %s", token)

		// 简单的 token 验证
		// 在实际应用中，这里应该使用 JWT 验证或其他验证方式
		if !strings.HasPrefix(token, "test_token_") {
			log.Printf("认证中间件 - 无效的 token 格式")
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// 从 token 中提取用户名
		username := strings.TrimPrefix(token, "test_token_")
		log.Printf("认证中间件 - 从 token 中提取的用户名: %s", username)

		// 根据用户名设置角色
		role := "user"
		if username == "admin" {
			role = "admin"
			log.Printf("认证中间件 - 检测到管理员用户，设置角色为 admin")
		}

		// 将用户信息存储在上下文中
		c.Set("userID", username) // 使用用户名作为临时ID
		c.Set("userRole", role)
		c.Set("username", username)

		log.Printf("认证中间件 - 认证成功，用户ID: %s, 角色: %s, 用户名: %s", username, role, username)
		c.Next()
	}
} 