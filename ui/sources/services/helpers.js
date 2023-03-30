import JSZip from 'jszip/dist/jszip';

const From = {
    DataURL: (data) => {
        const regex = /^data:(.+);base64,(.*)$/;
        const matches = data.match(regex);
        if (!matches)
            return [null, null];
        return [window.atob(matches[2]), matches[1]];
    },
    ArrayBuffer: (buffer) => {
        return From.Uint8Array(new Uint8Array(buffer));
    },
    Uint8Array: (buffer) => {
        var binary = '';
        const array = buffer;
        for (var i = 0; i < array.byteLength; i++)
            binary += String.fromCharCode(array[i]);
        return binary;
    },
}

const To = {
    DataURL: (binary, contentType) => {
        return `data:${contentType};base64,${window.btoa(binary)}`;
    },
    ArrayBuffer: (binary) => {
        return To.Uint8Array(binary).buffer;
    },
    Uint8Array: (binary) => {
        var array = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++)
            array[i] = binary.charCodeAt(i);
        return array;
    },
}

export default class Helpers {
	static #urls = {};

	static createObjectUrl(data) {
		if (this.#urls[data])
			return this.#urls[data];

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

		this.#urls[data] = URL.createObjectURL(blob);

		return this.#urls[data];
	}

	static async zip(files) {
		const zip = new JSZip();

		for (let file of files)
			zip.file(file.path, file.data);

		return await zip.generateAsync({ type: 'uint8array' });
	}

	static async unzip(content) {
		const zip = await new JSZip().loadAsync(content);

		const files = [];
		for (let path in zip.files) {
			const obj = zip.files[path];

			if (obj.dir)
				continue;

			const data = await obj.async('uint8array');
			files.push({ path, data });
		}

		return files;
	}

	static async requestDataURL(url) {
		if (!url)
			return null;

		try {
			const response = await fetch(url);
			if (response.status != 200)
				return null;

			const buffer = await response.arrayBuffer();
			const cover = From.ArrayBuffer(buffer);
			const contentType = response.headers.get('Content-Type');

			return To.DataURL(cover, contentType);
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}
