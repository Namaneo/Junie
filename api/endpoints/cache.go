package endpoints

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"strings"
)

func findFiles(physicalPath string, virtualPath string, suffix string) []string {
	urls := []string{}

	files, err := ioutil.ReadDir(physicalPath)
	if err != nil {
		log.Panic(err)
	}

	for _, file := range files {
		if file.IsDir() {
			ppath := path.Join(physicalPath, file.Name())
			vpath := path.Join(virtualPath, file.Name())
			urls = append(urls, findFiles(ppath, vpath, suffix)...)
			continue
		}

		if suffix != "" && !strings.HasSuffix(file.Name(), suffix) {
			continue
		}

		ppath := path.Join(virtualPath, file.Name())
		urls = append(urls, ppath)
	}

	return urls
}

func SendCache(w http.ResponseWriter, r *http.Request) {

	urls := []string{"/api/library"}

	urls = append(urls, findFiles(settings.Binaries.App, "/app", "")...)
	urls = append(urls, findFiles(settings.Resources.UI, "/assets", "png")...)
	urls = append(urls, findFiles(settings.Resources.App, "/app/assets", "png")...)
	urls = append(urls, findFiles(settings.Resources.App, "/app/assets", "json")...)

	payload, err := json.Marshal(urls)
	if err != nil {
		log.Panic(err)
	}

	w.Header().Add("Content-Type", "application/json")
	w.Write(payload)
}
