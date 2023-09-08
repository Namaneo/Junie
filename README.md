<p align="center"><img src="ui/assets/icon-round.png" width="150" /></p>

# <p align="center">Junie</p>

Junie is a libretro frontend that aims to run entirely in your browser, desktop or mobile!
* No installation on the end-devices.
* Near-native performances thanks to WebAssembly.
* Wide range of supported/compatible cores (... soon).
* Progressive Web Application entirely accessible offline.

Junie currently runs on most recent browsers, but your experience will probably be better on Chrome and Safari.

[Try it here!](https://namaneo.github.io/Junie/)

***Disclaimer**: development is still in progress. I'll try my best not to break anything between releases (especially regarding local save files), but it's probably a good idea for you to backup your saves before each update.*

# Supported features

- [x] All the systems described in the [Folder structure](#folder-structure).
- [x] Save files and cheats (stored inside your browser's storage).
- [x] Core-specific configurations override.
- [x] Multi-touch controller with either a D-pad.
- [x] Touch inputs for the Nintendo DS, when the gamepad is hidden.
- [x] Save and restore states, backup and restore save files.
- [x] Fast-forward up to 4 times the original speed.
- [x] Minimalistic platform-specific user interface.
- [x] Entirely running offline from your homescreen.

# Folder structure

Games must be organized as follows, inside a `games` folder next to the application binaries:

```
games
├── Game Boy
├── Game Boy Color
├── Game Boy Advance
├── Nintendo DS
├── Master System
├── NES
├── SNES
├── Mega Drive
├── Nintendo 64
└── PlayStation
```

# Build & Run

## Build

Install the following dependencies: **yarn**, **make** and **zip**, and build the application:
```bash
make       # Build cores, libraries and the application
make pack  # Same as `make`, but also outputs binaries in a zip file
make watch # Same as `make`, but also rebuild on source file changes

# Additional flags:
# * DEBUG=1   : build app and ui in debug mode
# * UI_ONLY=1 : rebuild only on UI changes when watching
# * QUIET=    : enable verbose build mode
```

## Docker

If you prefer to use Docker, no need for any local dependencies:

```bash
docker run \
    -d --rm \
    --name junie \
    -p 8000:8000 \
    -v /path/to/games:/junie/games \
    namaneo/junie
```

# Credits

- [Libretro](https://github.com/libretro/) for all emulation cores.
- [glif.app](https://glif.app)/ for the AI generated icons.

# License

Junie is licensed under the [GNU General Public License v3.0](https://github.com/Namaneo/Junie/blob/main/LICENSE.md).
