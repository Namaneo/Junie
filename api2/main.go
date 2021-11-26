package main

import (
	"log"
	"net/http"
)

type Common struct {
	Binaries struct {
		UI  string
		App string
	}
	Resources struct {
		UI     string
		App    string
		Games  string
		System string
	}
}

func HandleStatic(virtualPath string, physicalPath string) {
	dir := http.Dir(physicalPath)
	fs := http.FileServer(dir)
	strip := http.StripPrefix(virtualPath, fs)
	http.Handle(virtualPath+"/", strip)
}

func main() {
	var files Common
	files.Binaries.UI = "../ui/build"
	files.Binaries.App = "../app/bin"
	files.Resources.UI = "../assets/ui"
	files.Resources.App = "../assets/app"
	files.Resources.Games = "../games"
	files.Resources.System = "../system"

	HandleStatic("", files.Binaries.UI)
	HandleStatic("/assets", files.Resources.UI)
	HandleStatic("/app", files.Binaries.App)
	HandleStatic("/app/assets", files.Resources.App)
	HandleStatic("/app/games", files.Resources.Games)
	HandleStatic("/app/system", files.Resources.System)

	//TODO: api handlers
	//TODO: covers handler

	log.Println("Listening on :3000...")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal(err)
	}
}
