package handler

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ChatRequest 结构体用于解析前端发送的请求体
// `binding:"required"` 确保 `prompt` 字段必须存在
type ChatRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

// DeepseekRequest 结构体用于构建发送给 DeepSeek API 的请求体
type DeepseekRequest struct {
	Model    string            `json:"model"`
	Messages []DeepseekMessage `json:"messages"`
}

// DeepseekMessage 结构体表示对话中的一条消息
type DeepseekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// DeepseekResponse 结构体用于解析 DeepSeek API 返回的响应
type DeepseekResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	// 如果需要，可以添加其他字段，如 Usage 等
}

// Chat 函数处理与大模型的聊天逻辑
func Chat(c *gin.Context) {
	// =================================================================
	// 1. 设置 API key，解析 request 等等
	// =================================================================

	// 从环境变量中获取 DeepSeek API Key
	apiKey := "sk-f8801025fdbc4e339d8c8837a8ea09ce"
	if apiKey == "" {
		// 如果环境变量未设置，返回服务器内部错误
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DEEPSEEK_API_KEY 未配置"})
		return
	}

	// 解析前端发送的 JSON 请求
	var chatRequest ChatRequest
	if err := c.ShouldBindJSON(&chatRequest); err != nil {
		// 如果请求体不符合格式，返回客户端错误
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误，需要 'prompt' 字段"})
		return
	}

	// =================================================================
	// 2. 调用远程的 deepseek api
	// =================================================================

	// DeepSeek API 的端点和模型配置
	apiURL := "https://api.deepseek.com/chat/completions"
	modelName := "deepseek-chat" // 或者使用 "deepseek-coder"

	// 构建发送给 DeepSeek 的请求体
	deepseekReq := DeepseekRequest{
		Model: modelName,
		Messages: []DeepseekMessage{
			{Role: "user", Content: chatRequest.Prompt},
		},
	}

	// 将请求体转换为 JSON 字节流
	reqBodyBytes, err := json.Marshal(deepseekReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法序列化请求体"})
		return
	}

	// 创建一个 HTTP POST 请求
	httpRequest, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqBodyBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法创建 HTTP 请求"})
		return
	}

	// 设置请求头
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("Authorization", "Bearer "+apiKey)
	httpRequest.Header.Set("Accept", "application/json")

	// 创建 HTTP 客户端并发送请求 (设置30秒超时)
	client := &http.Client{Timeout: 30 * time.Second}
	httpResponse, err := client.Do(httpRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "调用 DeepSeek API 失败: " + err.Error()})
		return
	}
	defer httpResponse.Body.Close()

	// 检查 DeepSeek API 的响应状态码
	if httpResponse.StatusCode != http.StatusOK {
		// 读取错误响应体
		errorBody, _ := ioutil.ReadAll(httpResponse.Body)
		errorMsg := "DeepSeek API 返回错误: " + httpResponse.Status
		if len(errorBody) > 0 {
			errorMsg += " - " + string(errorBody)
		}
		c.JSON(httpResponse.StatusCode, gin.H{"error": errorMsg})
		return
	}

	// =================================================================
	// 3. 封装解答，形成 resp
	// =================================================================

	// 解析 DeepSeek API 的成功响应体
	var deepseekResp DeepseekResponse
	if err := json.NewDecoder(httpResponse.Body).Decode(&deepseekResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法解析 DeepSeek API 响应"})
		return
	}

	// 检查响应中是否包含有效的回答
	if len(deepseekResp.Choices) == 0 || deepseekResp.Choices[0].Message.Content == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DeepSeek API 返回了空的回答"})
		return
	}

	// 提取回答并以约定的格式返回给前端
	reply := deepseekResp.Choices[0].Message.Content
	c.JSON(http.StatusOK, gin.H{
		"reply": reply,
	})
}
