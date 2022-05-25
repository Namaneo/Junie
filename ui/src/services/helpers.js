const urls = {};

export function createObjectUrl(data) {
    if (urls[data])
        return urls[data];

    const [binary, contentType] = From.DataURL(data);

    const sliceSize = 512;
    const byte_arrays = [];
    for (let offset = 0; offset < binary.length; offset += sliceSize) {
        const slice = binary.slice(offset, offset + sliceSize);

        const byte_numbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++)
            byte_numbers[i] = slice.charCodeAt(i);

        byte_arrays.push(new Uint8Array(byte_numbers));
    }

    const blob = new Blob(byte_arrays, {type: contentType});

    urls[data] = URL.createObjectURL(blob);

    return urls[data];
}

export const From = {
    DataURL: (data) => {
        const regex = /^data:(.+);base64,(.*)$/;
        const matches = data.match(regex);
        if (!matches)
            return [null, null];
        return [atob(matches[2]), matches[1]];
    },
    ArrayBuffer: (buffer) => {
        var binary = '';
        const array = new Uint8Array(buffer);
        for (var i = 0; i < array.byteLength; i++)
            binary += String.fromCharCode(array[i]);
        return binary;
    },
}

export const To = {
    DataURL: (binary, contentType) => {
        return `data:${contentType};base64,${btoa(binary)}`;
    },
    ArrayBuffer: (binary) => {
        var array = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++)
            array[i] = binary.charCodeAt(i);
        return array.buffer;
    },
}
