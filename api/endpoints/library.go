package endpoints

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"junie/helpers"
	"junie/models"
)

var re = regexp.MustCompile(` \(.*\)`)
var settings = helpers.GetSettings()

func fillGames(system *models.System) {

	path := path.Join(settings.Resources.Games, system.Name)
	games, err := ioutil.ReadDir(path)
	if err != nil {
		log.Panic(err)
	}

	for i := range games {

		name := games[i].Name()
		if strings.HasSuffix(name, ".png") {
			continue
		}

		name = strings.TrimSuffix(name, filepath.Ext(name))

		system.Games = append(system.Games, models.Game{
			Name:  re.ReplaceAllString(name, ""),
			Rom:   name + "." + system.Extension,
			Cover: "covers/" + system.Name + "/" + name + ".png",
		})

	}

}

func SendLibrary(w http.ResponseWriter, r *http.Request) {

	path := path.Join(settings.Resources.API, "library.json")
	library, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic(err)
	}

	var systems []models.System
	err = json.Unmarshal(library, &systems)
	if err != nil {
		log.Panic(err)
	}

	for i := range systems {
		fillGames(&systems[i])
	}

	library, err = json.Marshal(systems)
	if err != nil {
		log.Panic(err)
	}

	w.Write(library)
}
