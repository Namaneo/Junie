/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

export default class Filesystem {
	/**
	 * @param {string} path
	 * @returns {{ directories: string[], filename: string }}
	 */
	#parse(path) {
		if (path.startsWith('/'))
			path = path.substring(1);

		if (path.indexOf('/') == -1)
			return { directories: [], filename: path };

		const directories = path.substring(0, path.lastIndexOf('/')).split('/');
		const filename = path.substring(path.lastIndexOf('/') + 1);

		return { directories, filename };
	}

	/**
	 * @param {string} path
	 * @returns {Promise<FileSystemDirectoryHandle>}
	 */
	async #directory(path, create) {
		let directory = await navigator.storage.getDirectory();
		for (const component of this.#parse(path).directories)
			directory = await directory.getDirectoryHandle(component, { create });
		return directory;
	}

	/**
	 * @param {string} path
	 * @returns {Promise<FileSystemFileHandle>}
	 */
	async #file(path, create) {
		const directory = await this.#directory(path, create);
		const filename = this.#parse(path).filename;
		return await directory.getFileHandle(filename, { create });
	}

	/**
	 * @param {() => Promise<number>} action
	 * @returns {Promise<number>}
	 */
	async #catch(action, err_val) {
		try {
			return await action();

		} catch (e) {
			console.error(e);
			return err_val;
		}
	}

	/**
	 * @param {string} path
	 * @param {(file: FileSystemSyncAccessHandle) => number} action
	 * @returns {Promise<number>}
	 */
	async #exec(path, create, action) {
		const handle = await this.#file(path, create);
		const file = await handle.createSyncAccessHandle();

		const result = action(file);

		file.flush();
		file.close();

		return result;
	}

	/**
	 * @param {FileSystemDirectoryHandle} root
	 * @param {string} path
	 * @returns {Promise<string[]>}
	 */
	async #list(root, path) {
		if (!root) root = await navigator.storage.getDirectory();
		if (!path) path = '';

		const files = []
		for await (const handle of root.values()) {
			if (handle.kind == 'file')
				files.push(`${path}/${handle.name}`);

			if (handle.kind == 'directory')
				files.push(...await this.#list(handle, `${path}/${handle.name}`));
		}
		return files;
	};

	/**
	 * @returns {string[] | Promise<string[]>}
	 */
	list() {
		return this.#catch(async () => {
			return await this.#list();
		}, []);
	}

	/**
	 * @param {string} path
	 * @returns {number | Promise<number>}
	 */
	size(path) {
		return this.#catch(async () => {
			return await this.#exec(path, false, (file) => file.getSize());
		}, -1);
	}

	/**
	 * @param {string} path
	 * @param {Uint8Array} buffer
	 * @returns {number | Promise<number>}
	 */
	read(path, buffer, offset) {
		return this.#catch(async () => {
			return await this.#exec(path, false, (file) => file.read(buffer, { at: offset }));
		}, -1);
	}

	/**
	 * @param {string} path
	 * @param {Uint8Array} buffer
	 * @returns {number | Promise<number>}
	 */
	write(path, buffer, offset) {
		return this.#catch(async () => {
			return await this.#exec(path, true, (file) => file.write(buffer, { at: offset }));
		}, -1);
	}

	/**
	 * @param {string} path
	 * @returns {number | Promise<number>}
	 */
	remove(path) {
		return this.#catch(async () => {
			const handle = await this.#directory(path);
			await handle.removeEntry(this.#parse(path).filename);

			return 0;
		}, -1);
	}
}
