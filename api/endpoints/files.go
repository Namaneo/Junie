package endpoints

import (
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"path"

	"github.com/go-chi/chi/v5"
)

func sendFile(w http.ResponseWriter, r *http.Request, contentType string) {

	system, err := url.PathUnescape(chi.URLParam(r, "system"))
	if err != nil {
		log.Panic(err)
	}

	filename, err := url.PathUnescape(chi.URLParam(r, "filename"))
	if err != nil {
		log.Panic(err)
	}

	path := path.Join(settings.Resources.Games, system, filename)
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		log.Panic(err)
	}

	w.Header().Add("Content-Type", contentType)
	w.Write(bytes)

}

func SendGame(w http.ResponseWriter, r *http.Request) {
	sendFile(w, r, "application/octet-stream")
}

func SendCover(w http.ResponseWriter, r *http.Request) {
	sendFile(w, r, "image/png")
}
