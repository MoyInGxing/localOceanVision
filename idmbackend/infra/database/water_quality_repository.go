package database

import (
	"github.com/MoyInGxing/idm/domain"
	"gorm.io/gorm"
)

type GORMWaterQualityRepository struct {
	db *gorm.DB
}

func NewGORMWaterQualityRepository(db *gorm.DB) *GORMWaterQualityRepository {
	return &GORMWaterQualityRepository{db: db}
}

func (r *GORMWaterQualityRepository) FindAll() ([]*domain.WaterQuality, error) {
	var waterQuality []*domain.WaterQuality
	err := r.db.Order("record_time DESC").Find(&waterQuality).Error
	if err != nil {
		return nil, err
	}
	return waterQuality, nil
}

func (r *GORMWaterQualityRepository) FindByRecordID(recordID string) (*domain.WaterQuality, error) {
	var waterQuality domain.WaterQuality
	err := r.db.Where("record_id = ?", recordID).First(&waterQuality).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &waterQuality, nil
}

func (r *GORMWaterQualityRepository) FindByAreaID(areaID string) ([]*domain.WaterQuality, error) {
	var waterQuality []*domain.WaterQuality
	err := r.db.Where("area_id = ?", areaID).Order("record_time DESC").Find(&waterQuality).Error
	if err != nil {
		return nil, err
	}
	return waterQuality, nil
}

func (r *GORMWaterQualityRepository) FindByAreaIDWithPagination(areaID string, offset, limit int) ([]*domain.WaterQuality, error) {
	var waterQuality []*domain.WaterQuality
	err := r.db.Where("area_id = ?", areaID).
		Order("record_time DESC").
		Offset(offset).
		Limit(limit).
		Find(&waterQuality).Error
	if err != nil {
		return nil, err
	}
	return waterQuality, nil
}

func (r *GORMWaterQualityRepository) Create(waterQuality *domain.WaterQuality) error {
	return r.db.Create(waterQuality).Error
}

func (r *GORMWaterQualityRepository) Update(waterQuality *domain.WaterQuality) error {
	return r.db.Save(waterQuality).Error
}

func (r *GORMWaterQualityRepository) Delete(recordID string) error {
	return r.db.Where("record_id = ?", recordID).Delete(&domain.WaterQuality{}).Error
}

func (r *GORMWaterQualityRepository) GetLatestByAreaID(areaID string) (*domain.WaterQuality, error) {
	var waterQuality domain.WaterQuality
	err := r.db.Where("area_id = ? AND record_time IS NOT NULL", areaID).
		Order("record_time DESC").
		First(&waterQuality).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &waterQuality, nil
}