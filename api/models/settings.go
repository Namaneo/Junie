package models

type Settings struct {
	Binaries struct {
		UI  string
		App string
	}
	Resources struct {
		API   string
		Games string
	}
}
