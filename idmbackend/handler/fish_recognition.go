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
		Name      string `json:"name"`
		Score     string `json:"score"`
		BaikeInfo struct {
			BaikeURL    string `json:"baike_url"`
			ImageURL    string `json:"image_url"`
			Description string `json:"description"`
		} `json:"baike_info"`
	} `json:"result"`
	ErrorCode int    `json:"error_code"`
	ErrorMsg  string `json:"error_msg"`
}

func FishRecognitionHandler(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")
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

	token, err := getBaiduAccessToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取访问令牌失败: " + err.Error()})
		return
	}

	result, err := callBaiduAnimalAPI(token, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "识别服务调用失败: " + err.Error()})
		return
	}

	if result.ErrorCode != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("识别失败: %s (错误码: %d)", result.ErrorMsg, result.ErrorCode)})
		return
	}

	if len(result.Result) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未识别到鱼类"})
		return
	}

	var fishName, description string
	var score float64

	for _, item := range result.Result {
		if strings.Contains(item.Name, "鱼") || isFish(item.Name) {
			fishName = item.Name
			score, _ = strconv.ParseFloat(item.Score, 64)
			if item.BaikeInfo.Description != "" {
				description = item.BaikeInfo.Description
			}
			break
		}
	}

	if fishName == "" {
		fishName = result.Result[0].Name
		score, _ = strconv.ParseFloat(result.Result[0].Score, 64)
		description = result.Result[0].BaikeInfo.Description
	}

	if description == "" {
		description = "暂无详细描述信息。"
	}

	c.JSON(http.StatusOK, gin.H{
		"name":        fishName,
		"score":       score,
		"description": description,
	})
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
	apiKey := "5aeM3caTfZUjFRbkKQ73qgDv"
	secretKey := "hN3wIsK79UaCy6OvfPjMLNXh5B6Z44HB"
	url := "https://aip.baidubce.com/oauth/2.0/token"
	postData := fmt.Sprintf("grant_type=client_credentials&client_id=%s&client_secret=%s", apiKey, secretKey)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(url, "application/x-www-form-urlencoded", strings.NewReader(postData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var tokenResp BaiduAccessTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", err
	}
	if tokenResp.Error != "" {
		return "", fmt.Errorf("%s: %s", tokenResp.Error, tokenResp.ErrorDescription)
	}
	return tokenResp.AccessToken, nil
}

func callBaiduAnimalAPI(token string, imageData []byte) (*BaiduRecognitionResult, error) {
	urlStr := fmt.Sprintf("https://aip.baidubce.com/rest/2.0/image-classify/v1/animal?access_token=%s", token)

	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := imaging.Encode(&buf, img, imaging.JPEG, imaging.JPEGQuality(90)); err != nil {
		return nil, err
	}

	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	form := url.Values{}
	form.Set("image", encoded)
	form.Set("top_num", "6")
	form.Set("baike_num", "1")

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", urlStr, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result BaiduRecognitionResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func isFish(name string) bool {
	keywords := []string{"鲤鱼", "草鱼", "鲈鱼", "罗非鱼", "鲫鱼", "金鱼", "鲑鱼", "鲶鱼", "鳟鱼", "石斑鱼"}
	for _, k := range keywords {
		if strings.Contains(name, k) {
			return true
		}
	}
	return false
}
