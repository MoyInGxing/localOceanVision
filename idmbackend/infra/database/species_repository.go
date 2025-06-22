package database

import (
	"github.com/MoyInGxing/idm/domain"
	"gorm.io/gorm"
)

type GORMSpeciesRepository struct {
	db *gorm.DB
}

func NewGORMSpeciesRepository(db *gorm.DB) *GORMSpeciesRepository {
	return &GORMSpeciesRepository{db: db}
}

func (r *GORMSpeciesRepository) FindAll() ([]*domain.Species, error) {
	var species []*domain.Species
	err := r.db.Find(&species).Error
	if err != nil {
		return nil, err
	}
	return species, nil
}

func (r *GORMSpeciesRepository) FindByID(id uint) (*domain.Species, error) {
	var species domain.Species
	err := r.db.First(&species, id).Error
	if err != nil {
		return nil, err
	}
	return &species, nil
}

func (r *GORMSpeciesRepository) Create(species *domain.Species) error {
	return r.db.Create(species).Error
}

func (r *GORMSpeciesRepository) Update(species *domain.Species) error {
	return r.db.Save(species).Error
}

func (r *GORMSpeciesRepository) Delete(id uint) error {
	return r.db.Delete(&domain.Species{}, id).Error
}
