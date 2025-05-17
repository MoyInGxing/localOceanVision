package myrouter

import (
	"github.com/MoyInGxing/idm/handler"
	"github.com/gin-gonic/gin"
	"net/http"
)

func SetupRouter(userHandler *handler.UserHandler, authMiddleware *gin.HandlerFunc, adminAuthMiddleware *gin.HandlerFunc) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)

		// Protected routes
		protected := api.Group("/users").Use(*authMiddleware)
		{
			protected.GET("/profile", userHandler.GetProfile)
		}

		// Admin protected routes
		admin := api.Group("/admin").Use(*authMiddleware, *adminAuthMiddleware)
		{
			// Add admin specific endpoints here
			admin.GET("/dashboard", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "Admin dashboard"})
			})
		}
	}

	return r
}
