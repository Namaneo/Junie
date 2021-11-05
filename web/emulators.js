//Define cores mapping
const cores = {
    "quicknes": { name: "QuickNES",        library: "quicknes" },
    "snes9x":   { name: "Snes9x",          library: "snes9x"   },
    "genesis":  { name: "Genesis Plus GX", library: "genesis"  },
    "mgba":     { name: "mGBA",            library: "mgba"     },
    "melonds":  { name: "melonDS",         library: "melonds"  },
};

//Define systems mapping
const systems = {
    "NES":              cores["quicknes"],
    "SNES":             cores["snes9x"],
    "Master System":    cores["genesis"],
    "Mega Drive":       cores["genesis"],
    "Game Boy":         cores["mgba"],
    "Game Boy Color":   cores["mgba"],
    "Game Boy Advance": cores["mgba"],
    "Nintendo DS":      cores["melonds"],
};