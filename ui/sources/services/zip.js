import JSZip from 'jszip';

export default class Zip {
	/**
	 * @param {File[]} files
	 * @returns {Promise<Blob>}
	 */
	static async compress(files) {
		const zip = new JSZip();

		for (const file of files)
			zip.file(file.name.substring(1), file);

		return await zip.generateAsync({ type: 'blob' });
	}

	/**
	 * @param {Blob} archive
	 * @returns {Promise<File[]>}
	 */
	static async decompress(archive) {
		const zip = await new JSZip().loadAsync(archive);

		const files = [];
		for (const path in zip.files) {
			const object = zip.files[path];

			if (object.dir)
				continue;

			const data = await object.async('blob');
			files.push(new File([data], `/${path}`));
		}

		return files;
	}
}
