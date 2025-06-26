package domain

import "time"

type WaterQuality struct {
	RecordID             string     `gorm:"column:record_id;primaryKey" json:"record_id"`
	AreaID               string     `gorm:"column:area_id;not null" json:"area_id"`
	RecordTime           *time.Time `gorm:"column:record_time" json:"record_time"`
	WaterQualityCategory *string    `gorm:"column:water_quality_category" json:"water_quality_category"`
	Temperature          *float64   `gorm:"column:temperature" json:"temperature"`
	PHValue              *float64   `gorm:"column:ph_value" json:"ph_value"`
	DissolvedOxygen      *float64   `gorm:"column:dissolved_oxygen" json:"dissolved_oxygen"`
	Turbidity            *float64   `gorm:"column:turbidity" json:"turbidity"`
	Conductivity         *float64   `gorm:"column:conductivity" json:"conductivity"`
	Permanganate         *float64   `gorm:"column:permanganate" json:"permanganate"`
	AmmoniaNitrogen      *float64   `gorm:"column:ammonia_nitrogen" json:"ammonia_nitrogen"`
	TotalPhosphorus      *float64   `gorm:"column:tocal_phosphorus" json:"total_phosphorus"`
	TotalNitrogen        *float64   `gorm:"column:total_nitrogen" json:"total_nitrogen"`
	ChlorophyllA         *float64   `gorm:"column:chorophyllα" json:"chlorophyll_a"`
	AlgalDensity         *float64   `gorm:"column:algal_density" json:"algal_density"`
	DeviceID             *string    `gorm:"column:device_id" json:"device_id"`
	StationStatus        *string    `gorm:"column:station_status" json:"station_status"`
}

func (WaterQuality) TableName() string {
	return "water_quality"
}