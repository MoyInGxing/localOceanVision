package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

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

// CreateSpecies 批量创建物种数据
func (h *SpeciesHandler) CreateSpecies(c *gin.Context) {
	var speciesData []map[string]interface{}
	if err := c.ShouldBindJSON(&speciesData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误"})
		return
	}

	if len(speciesData) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有提供物种数据"})
		return
	}

	createdCount, err := h.speciesService.CreateSpeciesBatch(speciesData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建物种数据失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "物种数据创建成功",
		"created_count": createdCount,
	})
}

// ExportDatabaseSchema 导出数据库表结构信息为Markdown格式
func (h *SpeciesHandler) ExportDatabaseSchema(c *gin.Context) {
	// 生成数据库表结构的Markdown文档
	markdown := generateDatabaseSchemaMarkdown()
	
	// 设置响应头
	c.Header("Content-Type", "text/markdown; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=database_schema_%s.md", time.Now().Format("20060102_150405")))
	
	// 返回Markdown内容
	c.String(http.StatusOK, markdown)
}

// generateDatabaseSchemaMarkdown 生成数据库表结构的Markdown文档
func generateDatabaseSchemaMarkdown() string {
	var builder strings.Builder
	
	// 文档标题和说明
	builder.WriteString("# 海洋视觉系统数据库表结构文档\n\n")
	builder.WriteString(fmt.Sprintf("**生成时间**: %s\n\n", time.Now().Format("2006-01-02 15:04:05")))
	builder.WriteString("**数据库名称**: idm\n\n")
	builder.WriteString("**字符集**: utf8mb4\n\n")
	builder.WriteString("---\n\n")
	
	// 目录
	builder.WriteString("## 目录\n\n")
	builder.WriteString("- [1. 用户表 (users)](#1-用户表-users)\n")
	builder.WriteString("- [2. 会话表 (sessions)](#2-会话表-sessions)\n")
	builder.WriteString("- [3. 物种表 (species)](#3-物种表-species)\n\n")
	builder.WriteString("---\n\n")
	
	// 用户表
	builder.WriteString("## 1. 用户表 (users)\n\n")
	builder.WriteString("**表名**: `users`\n\n")
	builder.WriteString("**描述**: 存储系统用户信息，包括管理员和普通用户\n\n")
	builder.WriteString("**字段说明**:\n\n")
	builder.WriteString("| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |\n")
	builder.WriteString("|--------|----------|------|--------|------|\n")
	builder.WriteString("| id | uint | PRIMARY KEY, AUTO_INCREMENT | - | 用户唯一标识符 |\n")
	builder.WriteString("| username | string | UNIQUE, NOT NULL | - | 用户名，必须唯一 |\n")
	builder.WriteString("| password | string | NOT NULL | - | 加密后的密码 |\n")
	builder.WriteString("| role | varchar(10) | - | 'user' | 用户角色：admin(管理员) 或 user(普通用户) |\n\n")
	
	builder.WriteString("**索引**:\n")
	builder.WriteString("- PRIMARY KEY: `id`\n")
	builder.WriteString("- UNIQUE INDEX: `username`\n\n")
	
	builder.WriteString("**示例数据**:\n")
	builder.WriteString("```sql\n")
	builder.WriteString("INSERT INTO users (username, password, role) VALUES\n")
	builder.WriteString("('admin', '$2a$10$...', 'admin'),\n")
	builder.WriteString("('user1', '$2a$10$...', 'user');\n")
	builder.WriteString("```\n\n")
	
	// 会话表
	builder.WriteString("## 2. 会话表 (sessions)\n\n")
	builder.WriteString("**表名**: `sessions`\n\n")
	builder.WriteString("**描述**: 存储用户登录会话信息，用于身份验证和会话管理\n\n")
	builder.WriteString("**字段说明**:\n\n")
	builder.WriteString("| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |\n")
	builder.WriteString("|--------|----------|------|--------|------|\n")
	builder.WriteString("| id | uint | PRIMARY KEY, AUTO_INCREMENT | - | 会话唯一标识符 |\n")
	builder.WriteString("| user_id | uint | INDEX | - | 关联的用户ID |\n")
	builder.WriteString("| token | string | UNIQUE, NOT NULL | - | 会话令牌 |\n")
	builder.WriteString("| expiry | time.Time | INDEX | - | 会话过期时间 |\n\n")
	
	builder.WriteString("**索引**:\n")
	builder.WriteString("- PRIMARY KEY: `id`\n")
	builder.WriteString("- UNIQUE INDEX: `token`\n")
	builder.WriteString("- INDEX: `user_id`\n")
	builder.WriteString("- INDEX: `expiry`\n\n")
	
	builder.WriteString("**外键关系**:\n")
	builder.WriteString("- `user_id` → `users.id`\n\n")
	
	// 物种表
	builder.WriteString("## 3. 物种表 (species)\n\n")
	builder.WriteString("**表名**: `species`\n\n")
	builder.WriteString("**描述**: 存储海洋物种的详细信息，包括形态特征和生态数据\n\n")
	builder.WriteString("**字段说明**:\n\n")
	builder.WriteString("| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |\n")
	builder.WriteString("|--------|----------|------|--------|------|\n")
	builder.WriteString("| id | uint | PRIMARY KEY, AUTO_INCREMENT | - | 物种唯一标识符 |\n")
	builder.WriteString("| species_name | string | NOT NULL | - | 物种中文名称 |\n")
	builder.WriteString("| scientific_name | string | NOT NULL | - | 物种学名（拉丁名） |\n")
	builder.WriteString("| category | string | NOT NULL | - | 物种分类/类别 |\n")
	builder.WriteString("| weight | float64 | NOT NULL | - | 体重（克） |\n")
	builder.WriteString("| length1 | float64 | NOT NULL | - | 体长1（厘米） |\n")
	builder.WriteString("| length2 | float64 | NOT NULL | - | 体长2（厘米） |\n")
	builder.WriteString("| length3 | float64 | NOT NULL | - | 体长3（厘米） |\n")
	builder.WriteString("| height | float64 | NOT NULL | - | 高度（厘米） |\n")
	builder.WriteString("| width | float64 | NOT NULL | - | 宽度（厘米） |\n")
	builder.WriteString("| optimal_temp_range | string | NOT NULL | - | 适宜温度范围 |\n\n")
	
	builder.WriteString("**索引**:\n")
	builder.WriteString("- PRIMARY KEY: `id`\n\n")
	
	builder.WriteString("**示例数据**:\n")
	builder.WriteString("```sql\n")
	builder.WriteString("INSERT INTO species (species_name, scientific_name, category, weight, length1, length2, length3, height, width, optimal_temp_range) VALUES\n")
	builder.WriteString("('带鱼', 'Trichiurus lepturus', '鱼类', 500.0, 35.0, 32.0, 30.0, 8.0, 3.0, '15-25°C'),\n")
	builder.WriteString("('黄花鱼', 'Larimichthys crocea', '鱼类', 300.0, 25.0, 23.0, 21.0, 6.0, 4.0, '18-28°C');\n")
	builder.WriteString("```\n\n")
	
	// 数据库关系图
	builder.WriteString("## 数据库关系图\n\n")
	builder.WriteString("```\n")
	builder.WriteString("┌─────────────┐    ┌──────────────┐\n")
	builder.WriteString("│    users    │    │   sessions   │\n")
	builder.WriteString("├─────────────┤    ├──────────────┤\n")
	builder.WriteString("│ id (PK)     │◄───┤ user_id (FK) │\n")
	builder.WriteString("│ username    │    │ id (PK)      │\n")
	builder.WriteString("│ password    │    │ token        │\n")
	builder.WriteString("│ role        │    │ expiry       │\n")
	builder.WriteString("└─────────────┘    └──────────────┘\n")
	builder.WriteString("\n")
	builder.WriteString("┌─────────────────────┐\n")
	builder.WriteString("│       species       │\n")
	builder.WriteString("├─────────────────────┤\n")
	builder.WriteString("│ id (PK)             │\n")
	builder.WriteString("│ species_name        │\n")
	builder.WriteString("│ scientific_name     │\n")
	builder.WriteString("│ category            │\n")
	builder.WriteString("│ weight              │\n")
	builder.WriteString("│ length1/2/3         │\n")
	builder.WriteString("│ height              │\n")
	builder.WriteString("│ width               │\n")
	builder.WriteString("│ optimal_temp_range  │\n")
	builder.WriteString("└─────────────────────┘\n")
	builder.WriteString("```\n\n")
	
	// 使用说明
	builder.WriteString("## 使用说明\n\n")
	builder.WriteString("### 数据库连接\n")
	builder.WriteString("```go\n")
	builder.WriteString("// 数据库配置\n")
	builder.WriteString("dsn := \"lmyx:1@tcp(localhost:3306)/idm?charset=utf8mb4&parseTime=True&loc=Local\"\n")
	builder.WriteString("db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})\n")
	builder.WriteString("```\n\n")
	
	builder.WriteString("### 自动迁移\n")
	builder.WriteString("```go\n")
	builder.WriteString("// 自动创建表结构\n")
	builder.WriteString("db.AutoMigrate(&domain.User{}, &domain.Session{}, &domain.Species{})\n")
	builder.WriteString("```\n\n")
	
	builder.WriteString("### API接口\n")
	builder.WriteString("- `GET /api/species` - 获取所有物种数据\n")
	builder.WriteString("- `GET /api/database/schema` - 导出数据库表结构文档\n")
	builder.WriteString("- `POST /api/auth/login` - 用户登录\n")
	builder.WriteString("- `POST /api/auth/register` - 用户注册\n")
	builder.WriteString("- `POST /api/auth/logout` - 用户登出\n\n")
	
	// 维护说明
	builder.WriteString("## 维护说明\n\n")
	builder.WriteString("### 备份数据库\n")
	builder.WriteString("```bash\n")
	builder.WriteString("mysqldump -u lmyx -p1 idm > backup_$(date +%Y%m%d_%H%M%S).sql\n")
	builder.WriteString("```\n\n")
	
	builder.WriteString("### 查看表结构\n")
	builder.WriteString("```sql\n")
	builder.WriteString("DESCRIBE users;\n")
	builder.WriteString("DESCRIBE sessions;\n")
	builder.WriteString("DESCRIBE species;\n")
	builder.WriteString("```\n\n")
	
	builder.WriteString("### 查看表数据\n")
	builder.WriteString("```sql\n")
	builder.WriteString("SELECT COUNT(*) FROM users;\n")
	builder.WriteString("SELECT COUNT(*) FROM sessions;\n")
	builder.WriteString("SELECT COUNT(*) FROM species;\n")
	builder.WriteString("```\n\n")
	
	builder.WriteString("---\n\n")
	builder.WriteString("*本文档由系统自动生成，如有疑问请联系开发团队。*\n")
	
	return builder.String()
}
