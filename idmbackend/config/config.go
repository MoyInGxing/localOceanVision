package config

import (
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	DatabaseURL     string        `mapstructure:"url"`
	JWTSignatureKey string        `mapstructure:"signature_key"`
	TokenExpiry     time.Duration `mapstructure:"token_expiry"`
	SessionExpiry   time.Duration `mapstructure:"expiry"`
}

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("ini")
	viper.AddConfigPath("./") // Look for the config file in the ./config directory

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found; set defaults or return an error
			viper.SetDefault("url", "lmyx:1@tcp(127.0.0.1:3306)/idm?charset=utf8mb4&parseTime=True&loc=Local")
			viper.SetDefault("signature_key", "secret-key")
			viper.SetDefault("token_expiry", "24h")
			viper.SetDefault("expiry", "72h")
			// You might want to log this and continue with defaults,
			// or return the error if a config file is strictly required.
			println("Config file not found, using default values.")
		} else {
			return nil, err // Config file was found but could not be read
		}
	}

	var config Config
	err := viper.Unmarshal(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
