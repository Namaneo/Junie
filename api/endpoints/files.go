package endpoints

import (
	"fmt"
	"io"
	"io/ioutil"
	"junie/helpers"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/go-chi/chi/v5"
)

func getParameters(r *http.Request) (string, string) {
	system, err := url.PathUnescape(chi.URLParam(r, "system"))
	if err != nil {
		log.Panic(err)
	}

	filename, err := url.PathUnescape(chi.URLParam(r, "filename"))
	if err != nil {
		log.Panic(err)
	}

	return system, filename
}

func request(system string, filename string) ([]byte, error) {

	sys, err := helpers.GetSystem(system)
	if err != nil {
		log.Panic(err)
	}

	system = strings.ReplaceAll(sys.FullName, " ", "_")

	url := fmt.Sprintf("https://raw.githubusercontent.com/libretro-thumbnails/%s/master/Named_Boxarts/%s", system, filename)

	response, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cover not found: %s (%s)", system, filename)
	}

	defer response.Body.Close()

	file, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return file, nil
}

func SendGame(w http.ResponseWriter, r *http.Request) {
	settings := helpers.GetSettings()

	system, filename := getParameters(r)

	path := path.Join(settings.Resources.Games, system, filename)
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic(err)
	}

	w.Header().Add("Content-Type", "application/octet-stream")
	w.Write(file)
}

func SendCover(w http.ResponseWriter, r *http.Request) {
	settings := helpers.GetSettings()

	w.Header().Add("Content-Type", "image/png")

	system, filename := getParameters(r)

	filePath := path.Join(settings.Resources.Games, system, filename)
	file, err := ioutil.ReadFile(filePath)
	if err == nil {
		w.Write(file)
		return
	}

	file, err = request(system, filename)
	if err == nil {
		ioutil.WriteFile(filePath, file, 0664)
		w.Write(file)
		return
	}

	log.Panic(err)
}
