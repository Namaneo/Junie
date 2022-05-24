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
