package domain

import "time"

type Session struct {
	ID     uint      `gorm:"primaryKey"`
	UserID uint      `gorm:"index"`
	Token  string    `gorm:"unique;not null"`
	Expiry time.Time `gorm:"index"`
}
