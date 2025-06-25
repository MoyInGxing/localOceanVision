package app

import (
	"fmt"
	"github.com/MoyInGxing/idm/domain"
)

type SpeciesRepository interface {
	FindAll() ([]*domain.Species, error)
	FindByID(id uint) (*domain.Species, error)
	Create(species *domain.Species) error
	Update(species *domain.Species) error
	Delete(id uint) error
}

type SpeciesService struct {
	speciesRepo SpeciesRepository
}

func NewSpeciesService(repo SpeciesRepository) *SpeciesService {
	return &SpeciesService{speciesRepo: repo}
}

func (s *SpeciesService) GetAllSpecies() ([]*domain.Species, error) {
	return s.speciesRepo.FindAll()
}

func (s *SpeciesService) GetSpeciesByID(id uint) (*domain.Species, error) {
	return s.speciesRepo.FindByID(id)
}

func (s *SpeciesService) CreateSpecies(species *domain.Species) error {
	return s.speciesRepo.Create(species)
}

func (s *SpeciesService) UpdateSpecies(species *domain.Species) error {
	return s.speciesRepo.Update(species)
}

func (s *SpeciesService) DeleteSpecies(id uint) error {
	return s.speciesRepo.Delete(id)
}

// CreateSpeciesBatch 批量创建物种数据
func (s *SpeciesService) CreateSpeciesBatch(speciesData []map[string]interface{}) (int, error) {
	createdCount := 0
	
	for _, data := range speciesData {
		// 验证必需字段
		speciesName, ok := data["species_name"].(string)
		if !ok || speciesName == "" {
			return createdCount, fmt.Errorf("species_name is required")
		}
		
		weight, ok := data["weight"].(float64)
		if !ok {
			return createdCount, fmt.Errorf("weight must be a number")
		}
		
		length1, ok := data["length1"].(float64)
		if !ok {
			return createdCount, fmt.Errorf("length1 must be a number")
		}
		
		// 创建物种对象
		species := &domain.Species{
			SpeciesName:      speciesName,
			ScientificName:   getString(data, "scientific_name"),
			Category:         getString(data, "category"),
			Weight:           weight,
			Length1:          length1,
			Length2:          getFloat64(data, "length2"),
			Length3:          getFloat64(data, "length3"),
			Height:           getFloat64(data, "height"),
			Width:            getFloat64(data, "width"),
			OptimalTempRange: getString(data, "optimal_temp_range"),
		}
		
		// 创建物种
		if err := s.speciesRepo.Create(species); err != nil {
			return createdCount, fmt.Errorf("failed to create species %s: %v", speciesName, err)
		}
		
		createdCount++
	}
	
	return createdCount, nil
}

// 辅助函数：安全获取字符串值
func getString(data map[string]interface{}, key string) string {
	if val, ok := data[key].(string); ok {
		return val
	}
	return ""
}

// 辅助函数：安全获取float64值
func getFloat64(data map[string]interface{}, key string) float64 {
	if val, ok := data[key].(float64); ok {
		return val
	}
	return 0.0
}
