package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
)

type BaiduAccessTokenResponse struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int    `json:"expires_in"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

type BaiduRecognitionResult struct {
	LogID  int64 `json:"log_id"`
	Result []struct {
		Name  string `json:"name"`
		Score string `json:"score"`
	} `json:"result"`
	ErrorCode int    `json:"error_code"`
	ErrorMsg  string `json:"error_msg"`
}

func FishRecognitionHandler(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未提供图片"})
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取图片失败"})
		return
	}

	if err := validateImage(imageData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, err := getBaiduAccessToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取访问令牌失败: " + err.Error()})
		return
	}

	recognitionResult, err := callBaiduAnimalAPI(accessToken, imageData, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "识别服务调用失败: " + err.Error()})
		return
	}

	if recognitionResult.ErrorCode != 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("识别失败: %s (错误码: %d)", recognitionResult.ErrorMsg, recognitionResult.ErrorCode),
		})
		return
	}

	var fishResultName string
	var fishResultScore float64
	for _, item := range recognitionResult.Result {
		if strings.Contains(item.Name, "鱼") || isFish(item.Name) {
			fishResultName = item.Name
			fishResultScore, _ = strconv.ParseFloat(item.Score, 64)
			break
		}
	}
	if fishResultName == "" && len(recognitionResult.Result) > 0 {
		fishResultName = recognitionResult.Result[0].Name
		fishResultScore, _ = strconv.ParseFloat(recognitionResult.Result[0].Score, 64)
	}
	if fishResultName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未识别到鱼类"})
		return
	}

	fishDescriptions := map[string]string{
		"鲤鱼":  "鲤鱼是一种常见的淡水鱼，适应性强，生长迅速。",
		"草鱼":  "草鱼以水草为食，生长速度快，是重要的养殖鱼类。",
		"鲈鱼":  "鲈鱼是优质的海水鱼类，肉质鲜美，经济价值高。",
		"罗非鱼": "罗非鱼生长快，适应性强，是重要的热带养殖鱼类。",
		"鲫鱼":  "鲫鱼体型较小，适应能力强，分布广泛。",
		"金鱼":  "金鱼是观赏鱼类，常见于水族馆和家庭鱼缸。",
		"鲑鱼":  "鲑鱼是洄游性鱼类，肉质鲜美富含Omega-3。",
		"鲶鱼":  "鲶鱼是无鳞鱼，喜欢栖息在底层水域，杂食性。",
		"鳟鱼":  "鳟鱼是冷水性鱼类，肉质细嫩，适合多种烹饪方式。",
		"石斑鱼": "石斑鱼是高档海水鱼，肉质鲜美，经济价值高。",
	}
	description, exists := fishDescriptions[fishResultName]
	if !exists {
		for fishName, desc := range fishDescriptions {
			if strings.Contains(fishResultName, fishName) {
				description = desc
				exists = true
				break
			}
		}
	}
	if !exists {
		description = "暂无详细描述信息。"
	}

	c.JSON(http.StatusOK, gin.H{
		"name":        fishResultName,
		"score":       fishResultScore,
		"description": description,
	})
}

func isFish(name string) bool {
	fishKeywords := []string{"鲤鱼", "草鱼", "鲈鱼", "罗非鱼", "鲫鱼", "金鱼", "鲑鱼", "鲶鱼", "鳟鱼", "石斑鱼"}
	for _, keyword := range fishKeywords {
		if strings.Contains(name, keyword) {
			return true
		}
	}
	return false
}

func validateImage(data []byte) error {
	if len(data) < 1024 {
		return fmt.Errorf("图片文件过小（至少需要1KB）")
	}
	if len(data) > 4*1024*1024 {
		return fmt.Errorf("图片文件过大（最大支持4MB）")
	}
	_, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("无效的图片格式")
	}
	if format != "jpeg" && format != "png" {
		return fmt.Errorf("只支持JPEG和PNG格式")
	}
	return nil
}

func getBaiduAccessToken() (string, error) {
	apiKey := os.Getenv("BAIDU_AI_API_KEY")
	secretKey := os.Getenv("BAIDU_AI_SECRET_KEY")
	if apiKey == "" || secretKey == "" {
		return "", fmt.Errorf("未配置百度API密钥")
	}
	url := "https://aip.baidubce.com/oauth/2.0/token"
	postData := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s", apiKey, secretKey)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(url, "application/x-www-form-urlencoded", strings.NewReader(postData))
	if err != nil {
		return "", fmt.Errorf("请求Token失败: %v", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取Token响应失败: %v", err)
	}
	var tokenResp BaiduAccessTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("解析Token响应失败: %v", err)
	}
	if tokenResp.Error != "" {
		return "", fmt.Errorf("%s: %s", tokenResp.Error, tokenResp.ErrorDescription)
	}
	return tokenResp.AccessToken, nil
}

func callBaiduAnimalAPI(accessToken string, imageData []byte, filename string) (*BaiduRecognitionResult, error) {
	urlStr := fmt.Sprintf("https://aip.baidubce.com/rest/2.0/image-classify/v1/animal?access_token=%s", accessToken)
	processedData := make([]byte, len(imageData))
	copy(processedData, imageData)
	var err error
	processedData, err = convertToStandardFormat(processedData)
	if err != nil {
		return nil, fmt.Errorf("图片转换失败: %v", err)
	}
	processedData = removeExifData(processedData)
	processedData = ensureSizeLimit(processedData)
	base64Str := base64.StdEncoding.EncodeToString(processedData)
	form := url.Values{}
	form.Set("image", base64Str)
	form.Set("top_num", "6")
	form.Set("baike_num", "1")
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("POST", urlStr, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %v", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	fmt.Printf("图片大小: %d 字节\n", len(processedData))
	fmt.Printf("Base64大小: %d 字节\n", base64.StdEncoding.EncodedLen(len(processedData)))
	fmt.Printf("Base64开头: %s\n", base64Str[:30])
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求发送失败: %v", err)
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}
	fmt.Printf("百度API原始响应: %s\n", string(respBody))
	var result BaiduRecognitionResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %v", err)
	}
	return &result, nil
}

func convertToStandardFormat(imageData []byte) ([]byte, error) {
	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, fmt.Errorf("图片解码失败: %v", err)
	}
	if strings.ToLower(format) != "jpeg" && strings.ToLower(format) != "jpg" {
		var buf bytes.Buffer
		if err := imaging.Encode(&buf, img, imaging.JPEG, imaging.JPEGQuality(95)); err != nil {
			return nil, fmt.Errorf("格式转换失败: %v", err)
		}
		return buf.Bytes(), nil
	}
	return imageData, nil
}

func ensureSizeLimit(imageData []byte) []byte {
	if len(imageData) > 4*1024*1024 || base64.StdEncoding.EncodedLen(len(imageData)) > 4*1024*1024 {
		return compressImage(imageData, 3.5*1024*1024)
	}
	return imageData
}

func removeExifData(imageData []byte) []byte {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return imageData
	}
	var buf bytes.Buffer
	if err := imaging.Encode(&buf, img, imaging.JPEG, imaging.JPEGQuality(95)); err != nil {
		return imageData
	}
	return buf.Bytes()
}

func compressImage(imageData []byte, targetSize int) []byte {
	img, err := imaging.Decode(bytes.NewReader(imageData))
	if err != nil {
		return imageData
	}
	quality := 90
	for quality >= 50 {
		var buf bytes.Buffer
		if err := imaging.Encode(&buf, img, imaging.JPEG, imaging.JPEGQuality(quality)); err != nil {
			return imageData
		}
		if buf.Len() <= targetSize {
			return buf.Bytes()
		}
		quality -= 5
	}
	return imageData
}
