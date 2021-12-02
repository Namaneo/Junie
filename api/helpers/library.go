package helpers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"junie/models"
	"path"
)

func GetSystems() ([]models.System, error) {

	filePath := path.Join(settings.Resources.API, "library.json")
	library, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var systems []models.System
	err = json.Unmarshal(library, &systems)
	if err != nil {
		return nil, err
	}

	return systems, nil
}

func GetSystem(name string) (*models.System, error) {
	systems, err := GetSystems()
	if err != nil {
		return nil, err
	}

	for _, system := range systems {
		if system.Name == name {
			return &system, nil
		}
	}

	return nil, fmt.Errorf("system '%s' could not be found", name)
}
