package helpers

import (
	"encoding/json"
	"io/ioutil"
	"junie/models"
	"log"
)

var (
	loaded   bool
	settings models.Settings
)

func GetSettings() *models.Settings {
	if loaded {
		return &settings
	}

	file, err := ioutil.ReadFile("settings.json")
	if err != nil {
		file, err = ioutil.ReadFile("assets/api/settings.json")
		if err != nil {
			log.Panic(err)
		}
	}

	err = json.Unmarshal(file, &settings)
	if err != nil {
		log.Panic(err)
	}

	loaded = true

	return &settings
}
