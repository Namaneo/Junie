import JSZip from 'jszip/dist/jszip';

export default class Zip {
	static async compress(files) {
		const zip = new JSZip();

		for (let file of files)
			zip.file(file.path, file.data);

		return await zip.generateAsync({ type: 'uint8array' });
	}

	static async decompress(content) {
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
}
