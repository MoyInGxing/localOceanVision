package myrouter

import (
	"net/http"

	"fmt" // 新增
	"log" // 新增
	"net/http"

	"github.com/MoyInGxing/idm/handler"
	"github.com/MoyInGxing/idm/middleware"
	"github.com/MoyInGxing/idm/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	userHandler *handler.UserHandler,
	speciesHandler *handler.SpeciesHandler,
	fishRecognitionHandler gin.HandlerFunc, // 新增鱼类识别处理函数
	authMiddleware *middleware.AuthMiddleware,
	adminAuthMiddleware *middleware.AdminAuthMiddleware,
) *gin.Engine {
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)
		api.POST("/chat", handler.Chat)

		// 添加鱼类识别路由 - 不需要认证
		api.POST("/fish-recognition", fishRecognitionHandler) // 使用传入的 handler

		// Protected routes
		protected := api.Group("/users").Use(authMiddleware.Handle())
		{
			protected.GET("/profile", userHandler.GetProfile)
		}

		// Species routes
		species := api.Group("/species")
		{
			species.GET("", speciesHandler.GetAllSpecies)
		}

		// Database routes
		database := api.Group("/database")
		{
			database.GET("/schema", speciesHandler.ExportDatabaseSchema)
		}

		// Admin protected routes
		admin := api.Group("/admin").Use(authMiddleware.Handle(), adminAuthMiddleware.Handle())
		{
			// Add admin specific endpoints here
			admin.GET("/dashboard", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "Admin dashboard"})
			})
		}
	}

	// 调试：打印所有路由
	fmt.Println("=== 注册的路由列表 ===")
	for _, route := range r.Routes() {
		log.Printf("%-6s %s", route.Method, route.Path)
	}

	return r
}
