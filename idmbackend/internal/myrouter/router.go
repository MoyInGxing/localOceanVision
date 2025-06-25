package myrouter

import (
	"time"

	"github.com/MoyInGxing/idm/handler"
	"github.com/MoyInGxing/idm/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	userHandler *handler.UserHandler,
	speciesHandler *handler.SpeciesHandler,
	waterQualityHandler *handler.WaterQualityHandler,
	fishRecognitionHandler gin.HandlerFunc, // 新增鱼类识别处理函数
	authMiddleware *middleware.AuthMiddleware,
	adminAuthMiddleware *middleware.AdminAuthMiddleware,
) *gin.Engine {
	r := gin.Default()

	// 配置 CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001", "http://localhost:3000"}, // 允许前端开发地址
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"X-Total-Count"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 处理 OPTIONS 请求
	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(200)
	})

	// API 路由组
	api := r.Group("/api")
	{
		// 注册路由
		api.POST("/register", userHandler.Register)
		api.POST("/chat", handler.Chat)
		// 登录路由
		api.POST("/login", userHandler.Login)

		// 添加鱼类识别路由 - 不需要认证
		api.POST("/fish-recognition", fishRecognitionHandler) // 使用传入的 handler

		// 物种数据路由
		species := api.Group("/species")
		{
			species.GET("", speciesHandler.GetAllSpecies)
			species.POST("", speciesHandler.CreateSpecies)
		}

		// 水质数据路由
		waterQuality := api.Group("/water-quality")
		{
			// 获取所有水质数据
			waterQuality.GET("", waterQualityHandler.GetAllWaterQuality)
			// 根据记录ID获取水质数据
			waterQuality.GET("/record/:record_id", waterQualityHandler.GetWaterQualityByRecordID)
			// 根据区域ID获取水质数据（支持分页）
			waterQuality.GET("/area/:area_id", waterQualityHandler.GetWaterQualityByAreaID)
			// 获取指定区域的最新水质数据
			waterQuality.GET("/area/:area_id/latest", waterQualityHandler.GetLatestWaterQualityByAreaID)
			// 创建水质记录
			waterQuality.POST("", waterQualityHandler.CreateWaterQuality)
			// 更新水质记录
			waterQuality.PUT("/record/:record_id", waterQualityHandler.UpdateWaterQuality)
			// 删除水质记录
			waterQuality.DELETE("/record/:record_id", waterQualityHandler.DeleteWaterQuality)
		}

		// 数据库路由
		database := api.Group("/database")
		{
			database.GET("/schema", speciesHandler.ExportDatabaseSchema)
		}

		// 需要认证的路由
		authorized := api.Group("/users")
		authorized.Use(authMiddleware.Handle())
		{
			authorized.GET("/profile", userHandler.GetProfile)
		}

		// 需要管理员权限的路由
		admin := api.Group("/admin")
		admin.Use(authMiddleware.Handle(), adminAuthMiddleware.Handle())
		{
			admin.GET("/dashboard", userHandler.GetAdminDashboard)
			admin.GET("/users", userHandler.GetAllUsers)
			admin.DELETE("/users/:id", userHandler.DeleteUser)
			admin.PUT("/users/:id/role", userHandler.UpdateUserRole)
		}
	}

	return r
}
