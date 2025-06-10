package handler

import (
	"net/http"

	"github.com/MoyInGxing/idm/app"
	"github.com/gin-gonic/gin"
)

type SpeciesHandler struct {
	speciesService *app.SpeciesService
}

func NewSpeciesHandler(speciesService *app.SpeciesService) *SpeciesHandler {
	return &SpeciesHandler{
		speciesService: speciesService,
	}
}

func (h *SpeciesHandler) GetAllSpecies(c *gin.Context) {
	species, err := h.speciesService.GetAllSpecies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取物种数据失败"})
		return
	}

	c.JSON(http.StatusOK, species)
}
