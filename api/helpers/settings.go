package helpers

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"junie/models"
	"log"
)

var (
	loaded   bool
	settings models.Settings
)

func readSettings() ([]byte, error) {
	file, err := ioutil.ReadFile("settings.json")
	if err == nil {
		return file, nil
	}

	file, err = ioutil.ReadFile("assets/api/settings.json")
	if err == nil {
		return file, nil
	}

	return nil, errors.New("could not find settings.json")
}

func GetSettings() *models.Settings {
	if loaded {
		return &settings
	}

	file, err := readSettings()
	if err != nil {
		log.Panic(err)
	}

	err = json.Unmarshal(file, &settings)
	if err != nil {
		log.Panic(err)
	}

	loaded = true

	return &settings
}
