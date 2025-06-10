package middleware

import (
	"log"
	"reflect"

	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/domain"
	"github.com/gin-gonic/gin"
)

type AdminAuthMiddleware struct {
	authService *app.AuthService
}

func NewAdminAuthMiddleware(authService *app.AuthService) *AdminAuthMiddleware {
	return &AdminAuthMiddleware{
		authService: authService,
	}
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

		log.Printf("管理员中间件 - 当前用户角色: %v, 类型: %v", userRole, reflect.TypeOf(userRole))

		// 检查是否是管理员
		var roleStr string
		switch v := userRole.(type) {
		case string:
			roleStr = v
		case domain.Role:
			roleStr = string(v)
		default:
			log.Printf("管理员中间件 - 未知的角色类型: %v", reflect.TypeOf(userRole))
			c.JSON(403, gin.H{"error": "需要管理员权限"})
			c.Abort()
			return
		}

		log.Printf("管理员中间件 - 处理后的角色字符串: '%s'", roleStr)

		// 直接比较字符串
		if roleStr == "admin" {
			log.Printf("管理员中间件 - 管理员认证成功")
			c.Next()
			return
		}

		log.Printf("管理员中间件 - 用户角色不是管理员: %v", roleStr)
		c.JSON(403, gin.H{"error": "需要管理员权限"})
		c.Abort()
	}
}
