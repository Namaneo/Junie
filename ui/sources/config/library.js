import cover_game_boy_avance  from '../../images/covers/game-boy-advance.png'
import cover_game_boy_color   from '../../images/covers/game-boy-color.png'
import cover_game_boy         from '../../images/covers/game-boy.png'
import cover_master_system    from '../../images/covers/master-system.png'
import cover_mega_drive       from '../../images/covers/mega-drive.png'
import cover_nes              from '../../images/covers/nes.png'
import cover_nintendo_ds_dark from '../../images/covers/nintendo-ds-dark.png'
import cover_nintendo_ds      from '../../images/covers/nintendo-ds.png'
import cover_snes             from '../../images/covers/snes.png'

export default [
	{
		name: "NES",
		full_name: "Nintendo - Nintendo Entertainment System",
		core_name: "Nestopia",
		lib_name: "nestopia",
		extension: "nes",
		cover: cover_nes,
	},
	{
		name: "SNES",
		full_name: "Nintendo - Super Nintendo Entertainment System",
		core_name: "Snes9x",
		lib_name: "snes9x",
		extension: "smc",
		cover: cover_snes,
	},
	{
		name: "Master System",
		full_name: "Sega - Master System - Mark III",
		core_name: "Genesis Plus GX",
		lib_name: "genesis",
		extension: "sms",
		cover: cover_master_system,
	},
	{
		name: "Mega Drive",
		full_name: "Sega - Mega Drive - Genesis",
		core_name: "Genesis Plus GX",
		lib_name: "genesis",
		extension: "md",
		cover: cover_mega_drive,
	},
	{
		name: "Game Boy",
		full_name: "Nintendo - Game Boy",
		core_name: "mGBA",
		lib_name: "mgba",
		extension: "gb",
		cover: cover_game_boy,
	},
	{
		name: "Game Boy Color",
		full_name: "Nintendo - Game Boy Color",
		core_name: "mGBA",
		lib_name: "mgba",
		extension: "gbc",
		cover: cover_game_boy_color,
	},
	{
		name: "Game Boy Advance",
		full_name: "Nintendo - Game Boy Advance",
		core_name: "mGBA",
		lib_name: "mgba",
		extension: "gba",
		cover: cover_game_boy_avance,
	},
	{
		name: "Nintendo DS",
		full_name: "Nintendo - Nintendo DS",
		core_name: "melonDS",
		lib_name: "melonds",
		extension: "nds",
		cover: cover_nintendo_ds,
		coverDark: cover_nintendo_ds_dark,
	}
]