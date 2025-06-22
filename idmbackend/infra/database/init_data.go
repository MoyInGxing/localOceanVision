package database

import (
	"github.com/MoyInGxing/idm/domain"
	"gorm.io/gorm"
)

func InitTestData(db *gorm.DB) error {
	// 检查是否已经有数据
	var count int64
	db.Model(&domain.Species{}).Count(&count)
	if count > 0 {
		return nil // 如果已经有数据，就不需要初始化
	}

	// 创建测试数据
	species := []domain.Species{
		{
			SpeciesName:      "鲤鱼",
			ScientificName:   "Cyprinus carpio",
			Category:         "淡水鱼",
			Weight:           500,
			Length1:          30,
			Length2:          25,
			Length3:          20,
			Height:           15,
			Width:            10,
			OptimalTempRange: "20-25℃",
		},
		{
			SpeciesName:      "草鱼",
			ScientificName:   "Ctenopharyngodon idella",
			Category:         "淡水鱼",
			Weight:           800,
			Length1:          40,
			Length2:          35,
			Length3:          30,
			Height:           20,
			Width:            15,
			OptimalTempRange: "22-28℃",
		},
		{
			SpeciesName:      "鲢鱼",
			ScientificName:   "Hypophthalmichthys molitrix",
			Category:         "淡水鱼",
			Weight:           600,
			Length1:          35,
			Length2:          30,
			Length3:          25,
			Height:           18,
			Width:            12,
			OptimalTempRange: "20-26℃",
		},
	}

	// 批量创建数据
	for _, s := range species {
		if err := db.Create(&s).Error; err != nil {
			return err
		}
	}

	return nil
}
