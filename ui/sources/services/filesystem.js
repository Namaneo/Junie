/// <reference lib="webworker" />

export default class Filesystem {
	/** @type {{ [path: string]: FileSystemSyncAccessHandle }} */
	static #handles = [];

	/**
	 * @param {string} path
	 * @returns {{ directories: string[], filename: string }}
	 */
	static #parse(path) {
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
	static async #directory(path, create) {
		let directory = await navigator.storage.getDirectory();
		for (const component of Filesystem.#parse(path).directories)
			directory = await directory.getDirectoryHandle(component, { create });
		return directory;
	}

	/**
	 * @param {FileSystemDirectoryHandle} root
	 * @param {string} path
	 * @returns {Promise<string[]>}
	 */
	static async #list(root, path) {
		if (!root) root = await navigator.storage.getDirectory();
		if (!path) path = '';

		const files = []
		for await (const handle of root.values()) {
			if (handle.kind == 'file')
				files.push(`${path}/${handle.name}`);

			if (handle.kind == 'directory')
				files.push(...await Filesystem.#list(handle, `${path}/${handle.name}`));
		}
		return files;
	};

	/**
	 * @param {string} path
	 * @param {(file: FileSystemSyncAccessHandle) => number} action
	 * @returns {Promise<number>}
	 */
	static async #exec(path, create, action) {
		if (path.startsWith('/'))
			path = path.substring(1);

		if (!Filesystem.#handles[path]) {
			const directory = await Filesystem.#directory(path, create);
			const filename = Filesystem.#parse(path).filename;
			const handle = await directory.getFileHandle(filename, { create });
			Filesystem.#handles[path] = await handle.createSyncAccessHandle();
		}

		return action(Filesystem.#handles[path]);
	}

	/**
	 * @param {() => Promise<number>} action
	 * @returns {Promise<number>}
	 */
	static async #catch(action, err_val) {
		try {
			return await action();

		} catch (e) {
			return err_val;
		}
	}

	/**
	 * @param {string} path
	 * @param {boolean} create
	 * @returns {Promise<FileSystemSyncAccessHandle>}
	 */
	static async open(path, create) {
		if (path.startsWith('/'))
			path = path.substring(1);

		const directory = await Filesystem.#directory(path, create);
		const filename = Filesystem.#parse(path).filename;
		const handle = await directory.getFileHandle(filename, { create });
		return await handle.createSyncAccessHandle();
	}

	/**
	 * @returns {string[] | Promise<string[]>}
	 */
	list() {
		return Filesystem.#catch(() => {
			return Filesystem.#list();
		}, []);
	}

	/**
	 * @param {string} path
	 * @returns {number | Promise<number>}
	 */
	size(path) {
		return Filesystem.#catch(() => {
			return Filesystem.#exec(path, false, (file) => file.getSize());
		}, -1);
	}

	/**
	 * @param {string} path
	 * @param {Uint8Array} buffer
	 * @param {number} offset
	 * @returns {number | Promise<number>}
	 */
	read(path, buffer, offset) {
		return Filesystem.#catch(() => {
			return Filesystem.#exec(path, false, (file) => file.read(buffer, { at: offset }));
		}, -1);
	}

	/**
	 * @param {string} path
	 * @param {Uint8Array} buffer
	 * @param {number} offset
	 * @returns {number | Promise<number>}
	 */
	write(path, buffer, offset) {
		return Filesystem.#catch(() => {
			return Filesystem.#exec(path, true, (file) => file.write(buffer, { at: offset }));
		}, -1);
	}

	/**
	 * @param {string} path
	 * @returns {number | Promise<number>}
	 */
	remove(path) {
		return Filesystem.#catch(async () => {
			if (path.startsWith('/'))
				path = path.substring(1);

			if (Filesystem.#handles[path]) {
				Filesystem.#handles[path].flush();
				Filesystem.#handles[path].close();
				delete Filesystem.#handles[path];
			}

			const handle = await Filesystem.#directory(path);
			await handle.removeEntry(Filesystem.#parse(path).filename);

			return 0;
		}, -1);
	}
}
