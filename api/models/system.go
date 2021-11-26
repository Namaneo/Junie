package models

type System struct {
	Name      string `json:"name"`
	FullName  string `json:"fullName"`
	CoreName  string `json:"coreName"`
	CorePath  string `json:"corePath"`
	Extension string `json:"extension"`
	Cover     string `json:"cover"`
	CoverDark string `json:"coverDark"`

	Games []Game `json:"games"`
}
