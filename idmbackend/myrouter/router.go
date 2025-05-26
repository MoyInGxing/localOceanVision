package myrouter

import (
	"net/http"

	"github.com/MoyInGxing/idm/handler"
	"github.com/MoyInGxing/idm/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter(userHandler *handler.UserHandler, speciesHandler *handler.SpeciesHandler, authMiddleware *middleware.AuthMiddleware, adminAuthMiddleware *middleware.AdminAuthMiddleware) *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)

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

		// Admin protected routes
		admin := api.Group("/admin").Use(authMiddleware.Handle(), adminAuthMiddleware.Handle())
		{
			// Add admin specific endpoints here
			admin.GET("/dashboard", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "Admin dashboard"})
			})
		}
	}

	return r
}
