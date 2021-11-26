package helpers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func UseStaticFiles(r chi.Router, virtualPath string, physicalPath string) {
	r.Get(virtualPath+"/*", func(w http.ResponseWriter, r *http.Request) {
		fs := http.FileServer(http.Dir(physicalPath))
		fs = http.StripPrefix(virtualPath, fs)

		fs.ServeHTTP(w, r)
	})
}
