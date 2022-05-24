package main

import (
	"log"
	"net/http"
	"os"

	"junie/endpoints"
	"junie/helpers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	settings := helpers.GetSettings()

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.NoCache)

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		dir := http.Dir(settings.Binaries)
		fs := http.FileServer(dir)
		fs.ServeHTTP(w, r)
	})

	r.Get("/api/library", endpoints.SendLibrary)
	r.Get("/api/library/{system}/{filename}", endpoints.SendGame)

	port, found := os.LookupEnv("PORT")
	if !found {
		port = "3000"
	}

	log.Printf("Listening on :%s...\n", port)
	err := http.ListenAndServe(":"+port, r)

	if err != nil {
		log.Fatal(err)
	}
}
