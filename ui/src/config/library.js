import * as Helpers from '../services/helpers'

import cover_game_boy_avance  from '../../res/covers/game-boy-advance.png'
import cover_game_boy_color   from '../../res/covers/game-boy-color.png'
import cover_game_boy         from '../../res/covers/game-boy.png'
import cover_master_system    from '../../res/covers/master-system.png'
import cover_mega_drive       from '../../res/covers/mega-drive.png'
import cover_nes              from '../../res/covers/nes.png'
import cover_nintendo_ds_dark from '../../res/covers/nintendo-ds-dark.png'
import cover_nintendo_ds      from '../../res/covers/nintendo-ds.png'
import cover_snes             from '../../res/covers/snes.png'

export default library = [
	{
		name: "NES",
		full_name: "Nintendo - Nintendo Entertainment System",
		core_name: "QuickNES",
		extension: "nes",
		cover: Helpers.createObjectUrl(cover_nes),
	},
	{
		name: "SNES",
		full_name: "Nintendo - Super Nintendo Entertainment System",
		core_name: "Snes9x",
		extension: "smc",
		cover: Helpers.createObjectUrl(cover_snes),
	},
	{
		name: "Master System",
		full_name: "Sega - Master System - Mark III",
		core_name: "Genesis Plus GX",
		extension: "sms",
		cover: Helpers.createObjectUrl(cover_master_system),
	},
	{
		name: "Mega Drive",
		full_name: "Sega - Mega Drive - Genesis",
		core_name: "Genesis Plus GX",
		extension: "bin",
		cover: Helpers.createObjectUrl(cover_mega_drive),
	},
	{
		name: "Game Boy",
		full_name: "Nintendo - Game Boy",
		core_name: "mGBA",
		extension: "gb",
		cover: Helpers.createObjectUrl(cover_game_boy),
	},
	{
		name: "Game Boy Color",
		full_name: "Nintendo - Game Boy Color",
		core_name: "mGBA",
		extension: "gbc",
		cover: Helpers.createObjectUrl(cover_game_boy_color),
	},
	{
		name: "Game Boy Advance",
		full_name: "Nintendo - Game Boy Advance",
		core_name: "mGBA",
		extension: "gba",
		cover: Helpers.createObjectUrl(cover_game_boy_avance),
	},
	{
		name: "Nintendo DS",
		full_name: "Nintendo - Nintendo DS",
		core_name: "melonDS",
		extension: "nds",
		cover: Helpers.createObjectUrl(cover_nintendo_ds),
		coverDark: Helpers.createObjectUrl(cover_nintendo_ds_dark),
	}
]