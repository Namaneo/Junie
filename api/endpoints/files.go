package endpoints

import (
	"io/ioutil"
	"junie/helpers"
	"log"
	"net/http"
	"net/url"
	"path"

	"github.com/go-chi/chi/v5"
)

func SendGame(w http.ResponseWriter, r *http.Request) {
	settings := helpers.GetSettings()

	system, err := url.PathUnescape(chi.URLParam(r, "system"))
	if err != nil {
		log.Panic(err)
	}

	filename, err := url.PathUnescape(chi.URLParam(r, "filename"))
	if err != nil {
		log.Panic(err)
	}

	path := path.Join(settings.Resources.Games, system, filename)
	file, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic(err)
	}

	w.Header().Add("Content-Type", "application/octet-stream")
	w.Write(file)
}
