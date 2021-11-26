package main

import (
	"log"
	"net/http"

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

	helpers.UseStaticFiles(r, "", settings.Binaries.UI)
	helpers.UseStaticFiles(r, "/assets", settings.Resources.UI)
	helpers.UseStaticFiles(r, "/app", settings.Binaries.App)
	helpers.UseStaticFiles(r, "/app/assets", settings.Resources.App)
	helpers.UseStaticFiles(r, "/app/games", settings.Resources.Games)
	helpers.UseStaticFiles(r, "/app/system", settings.Resources.System)

	r.Get("/api/library", endpoints.SendLibrary)
	r.Get("/api/library/{system}/{filename}", endpoints.SendGame)

	r.Get("/covers/{system}/{filename}", endpoints.SendCover)

	log.Println("Listening on :3000...")
	err := http.ListenAndServe(":3000", r)

	if err != nil {
		log.Fatal(err)
	}
}
