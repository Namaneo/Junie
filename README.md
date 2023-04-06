# Junie

Junie is a [Libretro](https://www.libretro.com/index.php/home-2/) frontend that aims to run entirely in your browser, desktop or mobile!
* No installation on the end-devices.
* Near-native performances thanks to WebAssembly.
* Wide range of supported/compatible cores (... soon).
* Progressive Web Application fully accessible offline.

Junie currently runs on most recent browsers, but your experience will probably be better on Chrome and Safari.

[Try it here!](https://namaneo.github.io/Junie/)

***Disclaimer**: development is still in progress. I'll try my best not to break anything between releases (especially regarding local save files), but it's probably a good idea for you to backup your saves before each update.*

# Supported features

- [x] All the systems described in the [Folder structure](#folder-structure).
- [x] Save files and cheats (stored inside your browser's storage).
- [x] Core-specific configurations override.
- [x] Multi-touch controller, with either a D-pad or a Joystick.
- [x] Touch inputs for the Nintendo DS, when the gamepad is hidden.
- [x] Save and restore states, backup and restore save files.
- [x] Fast-forward up to 4 times the original speed.
- [x] Nice platform-specific user interface.
- [x] Fully working offline from your homescreen.

# Folder structure

Games must be organized as follows, inside a `games` folder next to the application binaries:

```
games
├── Game Boy
├── Game Boy Advance
├── Game Boy Color
├── Master System
├── Mega Drive
├── NES
├── Nintendo DS
└── SNES
```

# Build & Run

## Prerequisites

Junie is composed of 3 main components:
* The **UI**: developed in JSX using React and Ionic, located in the [ui](ui) folder.
* The **Emulator**: developed in C, located in the [app](app) folder.

## Build

First, install the following dependencies: **yarn**, **make** and **zip**. Then follow the instructions to install and setup [emscripten](https://emscripten.org/docs/getting_started/downloads.html).

```bash
emmake make       # Build cores, libraries and the application
emmake make pack  # Same as `make`, but also outputs binaries in a zip file
emmake make watch # Same as `make`, but also rebuild on source file changes

# Additional flags:
# * DEBUG=1 : build app and ui in debug mode
# * QUIET=  : enable verbose build mode
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

- [Gambatte](https://github.com/libretro/gambatte-libretro) for Game Boy and Game Boy Color emulation.
- [VBA-M](https://github.com/libretro/vbam-libretro) for Game Boy Advance emulation.
- [melonDS](https://github.com/libretro/melonDS) for Nintendo DS emulation.
- [Nestopia](https://github.com/libretro/Nestopia) for NES emulation.
- [Snes9x2010](https://github.com/libretro/snes9x2010) for SNES emulation.
- [Genesis Plus GX](https://github.com/libretro/Genesis-Plus-GX) for Master System and Mega Drive emulation.
- [libretro-thumbnails](https://github.com/libretro/libretro-thumbnails) for game covers.

# License

Junie is licensed under the [GNU General Public License v3.0](https://github.com/Namaneo/Junie/blob/main/LICENSE.md). When applicable, dependencies listed in the [Credits](#credits) section retain their original licenses.
