package middleware

import (
	"github.com/gin-gonic/gin"
	"log"
)

type AdminAuthMiddleware struct {
	// 可以添加依赖项，比如数据库连接等
}

func NewAdminAuthMiddleware() *AdminAuthMiddleware {
	return &AdminAuthMiddleware{}
}

func (m *AdminAuthMiddleware) Handle() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 打印所有上下文中的值，用于调试
		log.Printf("管理员中间件 - 上下文中的所有值: %v", c.Keys)

		// 从上下文中获取用户角色
		userRole, exists := c.Get("userRole")
		if !exists {
			log.Printf("管理员中间件 - 未找到用户角色")
			c.JSON(403, gin.H{"error": "需要管理员权限"})
			c.Abort()
			return
		}

		log.Printf("管理员中间件 - 当前用户角色: %v", userRole)

		// 检查是否是管理员
		if userRole != "admin" {
			log.Printf("管理员中间件 - 用户角色不是管理员: %v", userRole)
			c.JSON(403, gin.H{"error": "需要管理员权限"})
			c.Abort()
			return
		}

		log.Printf("管理员中间件 - 管理员认证成功")
		c.Next()
	}
} 