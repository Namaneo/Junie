import JSZip from 'jszip';

class ZipFile {
	/** @type {string} */
	path;

	/** @type {Uint8Array} */
	data;
}

export default class Zip {

	/**
	 * @param {ZipFile[]} files
	 * @returns {Promise<Uint8Array>}
	 */
	static async compress(files) {
		const zip = new JSZip();

		for (const file of files)
			zip.file(file.path, file.data);

		return await zip.generateAsync({ type: 'uint8array' });
	}

	/**
	 * @param {Uint8Array} files
	 * @returns {Promise<ZipFile[]>}
	 */
	static async decompress(content) {
		const zip = await new JSZip().loadAsync(content);

		const files = [];
		for (const path in zip.files) {
			const object = zip.files[path];

			if (object.dir)
				continue;

			const data = await object.async('uint8array');
			files.push({ path, data });
		}

		return files;
	}
}
