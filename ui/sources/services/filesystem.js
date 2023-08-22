/// <reference lib="webworker" />

export default class Filesystem {
	/** @type {{ [path: string]: FileSystemSyncAccessHandle }} */
	static #handles = [];

	/**
	 * @param {string} path
	 * @returns {{ path: string, filename: string, directories: string[] }}
	 */
	static parse(path) {
		path = `/${path}`.replace(/^\/+/, '/');

		const filename = path.substring(path.lastIndexOf('/') + 1);
		const directories = path.substring(1).indexOf('/') != -1
			? path.substring(1, path.lastIndexOf('/')).split('/')
			: [];

		return { path, directories, filename };
	}

	/**
	 * @param {string} path
	 * @returns {Promise<FileSystemDirectoryHandle>}
	 */
	static async #directory(path, create) {
		let directory = await navigator.storage.getDirectory();
		for (const component of Filesystem.parse(path).directories)
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
		const file = Filesystem.parse(path);

		if (!Filesystem.#handles[file.path]) {
			const directory = await Filesystem.#directory(file.path, create);
			const handle = await directory.getFileHandle(file.filename, { create });
			Filesystem.#handles[file.path] = await handle.createSyncAccessHandle();
		}

		return action(Filesystem.#handles[file.path]);
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
		const directory = await Filesystem.#directory(path, create);
		const filename = Filesystem.parse(path).filename;
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
			this.close(path);

			const handle = await Filesystem.#directory(path);
			await handle.removeEntry(Filesystem.parse(path).filename);

			return 0;
		}, -1);
	}

	/**
	 * @param {string} path
	 * @returns {void | Promise<void>}
	 */
	close(path) {
		return Filesystem.#catch(() => {
			path = Filesystem.parse(path).path;

			if (Filesystem.#handles[path]) {
				Filesystem.#handles[path].flush();
				Filesystem.#handles[path].close();
				delete Filesystem.#handles[path];
			}

			return 0;
		}, -1);
	}
}
