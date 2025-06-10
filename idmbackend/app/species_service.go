package app

import (
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
