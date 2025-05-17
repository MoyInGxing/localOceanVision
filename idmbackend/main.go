package main

import (
	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/config"
	"github.com/MoyInGxing/idm/handler"
	"github.com/MoyInGxing/idm/infra/database"
	"github.com/MoyInGxing/idm/internal/myrouter"
	"github.com/MoyInGxing/idm/middleware"
	"log"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := database.Init(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	db := database.GetDB()

	userRepo := database.NewGORMUserRepository(db)
	sessionRepo := database.NewGORMSessionRepository(db)

	userService := app.NewUserService(userRepo)
	authService := app.NewAuthService(userRepo, sessionRepo, cfg)

	userHandler := handler.NewUserHandler(userService, authService)
	authMiddleware := middleware.NewAuthMiddleware()
	adminAuthMiddleware := middleware.NewAdminAuthMiddleware()

	r := myrouter.SetupRouter(userHandler, authMiddleware, adminAuthMiddleware)

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
