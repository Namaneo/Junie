package models

type Settings struct {
	Binaries struct {
		UI  string
		App string
	}
	Resources struct {
		UI     string
		API    string
		App    string
		Games  string
		System string
	}
}
