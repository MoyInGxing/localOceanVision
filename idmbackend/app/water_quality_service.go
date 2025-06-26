package app

import (
	"github.com/MoyInGxing/idm/domain"
)

type WaterQualityRepository interface {
	FindAll() ([]*domain.WaterQuality, error)
	FindByRecordID(recordID string) (*domain.WaterQuality, error)
	FindByAreaID(areaID string) ([]*domain.WaterQuality, error)
	FindByAreaIDWithPagination(areaID string, offset, limit int) ([]*domain.WaterQuality, error)
	Create(waterQuality *domain.WaterQuality) error
	Update(waterQuality *domain.WaterQuality) error
	Delete(recordID string) error
	GetLatestByAreaID(areaID string) (*domain.WaterQuality, error)
}

type WaterQualityService struct {
	waterQualityRepo WaterQualityRepository
}

func NewWaterQualityService(repo WaterQualityRepository) *WaterQualityService {
	return &WaterQualityService{waterQualityRepo: repo}
}

func (s *WaterQualityService) GetAllWaterQuality() ([]*domain.WaterQuality, error) {
	return s.waterQualityRepo.FindAll()
}

func (s *WaterQualityService) GetWaterQualityByRecordID(recordID string) (*domain.WaterQuality, error) {
	return s.waterQualityRepo.FindByRecordID(recordID)
}

func (s *WaterQualityService) GetWaterQualityByAreaID(areaID string) ([]*domain.WaterQuality, error) {
	return s.waterQualityRepo.FindByAreaID(areaID)
}

func (s *WaterQualityService) GetWaterQualityByAreaIDWithPagination(areaID string, offset, limit int) ([]*domain.WaterQuality, error) {
	return s.waterQualityRepo.FindByAreaIDWithPagination(areaID, offset, limit)
}

func (s *WaterQualityService) CreateWaterQuality(waterQuality *domain.WaterQuality) error {
	return s.waterQualityRepo.Create(waterQuality)
}

func (s *WaterQualityService) UpdateWaterQuality(waterQuality *domain.WaterQuality) error {
	return s.waterQualityRepo.Update(waterQuality)
}

func (s *WaterQualityService) DeleteWaterQuality(recordID string) error {
	return s.waterQualityRepo.Delete(recordID)
}

func (s *WaterQualityService) GetLatestWaterQualityByAreaID(areaID string) (*domain.WaterQuality, error) {
	return s.waterQualityRepo.GetLatestByAreaID(areaID)
}