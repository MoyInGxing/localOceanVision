package handler

import (
	"net/http"
	"strconv"

	"github.com/MoyInGxing/idm/app"
	"github.com/MoyInGxing/idm/domain"
	"github.com/gin-gonic/gin"
)

type WaterQualityHandler struct {
	waterQualityService *app.WaterQualityService
}

func NewWaterQualityHandler(waterQualityService *app.WaterQualityService) *WaterQualityHandler {
	return &WaterQualityHandler{
		waterQualityService: waterQualityService,
	}
}

// GetAllWaterQuality 获取所有水质数据
func (h *WaterQualityHandler) GetAllWaterQuality(c *gin.Context) {
	waterQuality, err := h.waterQualityService.GetAllWaterQuality()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取水质数据失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": waterQuality,
		"total": len(waterQuality),
	})
}

// GetWaterQualityByRecordID 根据记录ID获取水质数据
func (h *WaterQualityHandler) GetWaterQualityByRecordID(c *gin.Context) {
	recordID := c.Param("record_id")
	if recordID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "记录ID不能为空"})
		return
	}

	waterQuality, err := h.waterQualityService.GetWaterQualityByRecordID(recordID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取水质数据失败"})
		return
	}

	if waterQuality == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定的水质记录"})
		return
	}

	c.JSON(http.StatusOK, waterQuality)
}

// GetWaterQualityByAreaID 根据区域ID获取水质数据
func (h *WaterQualityHandler) GetWaterQualityByAreaID(c *gin.Context) {
	areaID := c.Param("area_id")
	if areaID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "区域ID不能为空"})
		return
	}

	// 检查是否需要分页
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	if pageStr != "" && limitStr != "" {
		page, err := strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "页码必须是大于0的整数"})
			return
		}

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "每页数量必须是大于0的整数"})
			return
		}

		offset := (page - 1) * limit
		waterQuality, err := h.waterQualityService.GetWaterQualityByAreaIDWithPagination(areaID, offset, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取水质数据失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": waterQuality,
			"page": page,
			"limit": limit,
			"total": len(waterQuality),
		})
	} else {
		// 不分页，返回所有数据
		waterQuality, err := h.waterQualityService.GetWaterQualityByAreaID(areaID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取水质数据失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": waterQuality,
			"total": len(waterQuality),
		})
	}
}

// GetLatestWaterQualityByAreaID 获取指定区域的最新水质数据
func (h *WaterQualityHandler) GetLatestWaterQualityByAreaID(c *gin.Context) {
	areaID := c.Param("area_id")
	if areaID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "区域ID不能为空"})
		return
	}

	waterQuality, err := h.waterQualityService.GetLatestWaterQualityByAreaID(areaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取最新水质数据失败"})
		return
	}

	if waterQuality == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定区域的水质记录"})
		return
	}

	c.JSON(http.StatusOK, waterQuality)
}

// CreateWaterQuality 创建新的水质记录
func (h *WaterQualityHandler) CreateWaterQuality(c *gin.Context) {
	var waterQuality domain.WaterQuality
	if err := c.ShouldBindJSON(&waterQuality); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误: " + err.Error()})
		return
	}

	if err := h.waterQualityService.CreateWaterQuality(&waterQuality); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建水质记录失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "水质记录创建成功",
		"data": waterQuality,
	})
}

// UpdateWaterQuality 更新水质记录
func (h *WaterQualityHandler) UpdateWaterQuality(c *gin.Context) {
	recordID := c.Param("record_id")
	if recordID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "记录ID不能为空"})
		return
	}

	var waterQuality domain.WaterQuality
	if err := c.ShouldBindJSON(&waterQuality); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误: " + err.Error()})
		return
	}

	// 确保记录ID匹配
	waterQuality.RecordID = recordID

	if err := h.waterQualityService.UpdateWaterQuality(&waterQuality); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新水质记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "水质记录更新成功",
		"data": waterQuality,
	})
}

// DeleteWaterQuality 删除水质记录
func (h *WaterQualityHandler) DeleteWaterQuality(c *gin.Context) {
	recordID := c.Param("record_id")
	if recordID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "记录ID不能为空"})
		return
	}

	if err := h.waterQualityService.DeleteWaterQuality(recordID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除水质记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "水质记录删除成功"})
}

// GetTemperatureAndPHByAreaID 根据区域ID获取温度和pH值数据
func (h *WaterQualityHandler) GetTemperatureAndPHByAreaID(c *gin.Context) {
	areaID := c.Param("area_id")
	if areaID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "区域ID不能为空"})
		return
	}

	waterQuality, err := h.waterQualityService.GetWaterQualityByAreaID(areaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取水质数据失败"})
		return
	}

	// 提取温度和pH值数据
	type TemperaturePHData struct {
		RecordID    string   `json:"record_id"`
		AreaID      string   `json:"area_id"`
		RecordTime  *string  `json:"record_time"`
		Temperature *float64 `json:"temperature"`
		PHValue     *float64 `json:"ph_value"`
	}

	var result []TemperaturePHData
	for _, wq := range waterQuality {
		var recordTime *string
		if wq.RecordTime != nil {
			timeStr := wq.RecordTime.Format("2006-01-02 15:04:05")
			recordTime = &timeStr
		}
		
		result = append(result, TemperaturePHData{
			RecordID:    wq.RecordID,
			AreaID:      wq.AreaID,
			RecordTime:  recordTime,
			Temperature: wq.Temperature,
			PHValue:     wq.PHValue,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  result,
		"total": len(result),
	})
}