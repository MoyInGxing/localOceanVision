package database

import (
	"github.com/MoyInGxing/idm/config"
	"github.com/MoyInGxing/idm/domain"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) error {
	dsn := cfg.DatabaseURL
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	DB = db

	// AutoMigrate database schema
	if err := DB.AutoMigrate(&domain.User{}, &domain.Session{}); err != nil {
		return err
	}

	return nil
}

func GetDB() *gorm.DB {
	return DB
}
