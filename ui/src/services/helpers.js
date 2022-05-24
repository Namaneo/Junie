import cover_placeholder      from '../../res/placeholder.png'
import cover_game_boy_avance  from '../../res/covers/game-boy-advance.png'
import cover_game_boy_color   from '../../res/covers/game-boy-color.png'
import cover_game_boy         from '../../res/covers/game-boy.png'
import cover_master_system    from '../../res/covers/master-system.png'
import cover_mega_drive       from '../../res/covers/mega-drive.png'
import cover_nes              from '../../res/covers/nes.png'
import cover_nintendo_ds_dark from '../../res/covers/nintendo-ds-dark.png'
import cover_nintendo_ds      from '../../res/covers/nintendo-ds.png'
import cover_snes             from '../../res/covers/snes.png'

export function toBase64(buffer) {
    var binary = '';
    for (var i = 0; i < buffer.byteLength; i++)
        binary += String.fromCharCode(buffer[i]);
    return window.btoa(binary);
}

export function fromBase64(base64) {
    var binary = window.atob(base64);
    var buffer = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++)
        buffer[i] = binary.charCodeAt(i);
    return buffer;
}

export function createObjectUrl(data) {
    const sliceSize = 512;
    const regex = /^data:(.+);base64,(.*)$/;

    const matches = data.match(regex);
    const byte_characters = atob(matches[2]);
    const byte_arrays = [];

    for (let offset = 0; offset < byte_characters.length; offset += sliceSize) {
        const slice = byte_characters.slice(offset, offset + sliceSize);

        const byte_numbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++)
            byte_numbers[i] = slice.charCodeAt(i);

        byte_arrays.push(new Uint8Array(byte_numbers));
    }

    const blob = new Blob(byte_arrays, {type: matches[1]});

    return URL.createObjectURL(blob);
}

const placeholder = createObjectUrl(cover_placeholder);
const covers = {
    'placeholder.png':      placeholder,
    'game-boy-advance.png': createObjectUrl(cover_game_boy_avance),
    'game-boy-color.png':   createObjectUrl(cover_game_boy_color),
    'game-boy.png':         createObjectUrl(cover_game_boy),
    'master-system.png':    createObjectUrl(cover_master_system),
    'mega-drive.png':       createObjectUrl(cover_mega_drive),
    'nes.png':              createObjectUrl(cover_nes),
    'nintendo-ds-dark.png': createObjectUrl(cover_nintendo_ds_dark),
    'nintendo-ds.png':      createObjectUrl(cover_nintendo_ds),
    'snes.png':             createObjectUrl(cover_snes),
};

export function getPlaceholder() {
    return placeholder;
}

export function getSystemCover(system) {
	const dark_mode = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const cover = dark_mode && system.coverDark ? system.coverDark : system.cover;
	return covers[cover];
}
