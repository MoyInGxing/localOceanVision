package domain

type Species struct {
	ID               uint    `gorm:"column:id;primaryKey;autoIncrement" json:"species_id"`
	SpeciesName      string  `gorm:"column:species_name;not null" json:"species_name"`
	ScientificName   string  `gorm:"column:scientific_name;not null" json:"scientific_name"`
	Category         string  `gorm:"column:category;not null" json:"category"`
	Weight           float64 `gorm:"column:weight;not null" json:"weight"`
	Length1          float64 `gorm:"column:length1;not null" json:"length1"`
	Length2          float64 `gorm:"column:length2;not null" json:"length2"`
	Length3          float64 `gorm:"column:length3;not null" json:"length3"`
	Height           float64 `gorm:"column:height;not null" json:"height"`
	Width            float64 `gorm:"column:width;not null" json:"width"`
	OptimalTempRange string  `gorm:"column:optimal_temp_range;not null" json:"optimal_temp_range"`
}
