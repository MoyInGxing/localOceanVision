package database

import (
	"log"

	"github.com/MoyInGxing/idm/config"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) error {
	dsn := cfg.DatabaseURL
	log.Printf("正在连接数据库: %s", dsn)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	DB = db

	log.Println("数据库连接成功")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
