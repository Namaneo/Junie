import Filesystem from './filesystem';

const __WASI_ERRNO_SUCCESS = 0;
const __WASI_ERRNO_BADF = 8;
const __WASI_ERRNO_INVAL = 28;
const __WASI_ERRNO_NOENT = 44;

const WHENCE_SET = 0;
const WHENCE_CUR = 1;
const WHENCE_END = 2;

const O_CREAT = 9;

export const JUN = {
	/** @type {WebAssembly.Memory} */
	memory: null,

	/** @type {Filesystem} */
	filesystem: null,

	/** @type {number} */
	preopen: 0,

	/** @type {number} */
	next_fd: 3,

	/** @type {{ [fd: number]: {path: string, offset: number } }} */
	fds: {
		1: { offset: 0 },
		2: { offset: 0 },
	},

	/**
	 * @param {number} ptr
	 * @returns {number}
	 */
	get_uint32: (ptr) => {
		return new DataView(JUN.memory.buffer).getUint32(ptr, true);
	},

	/**
	 * @param {number} ptr
	 * @param {number} value
	 */
	set_uint32: (ptr, value) => {
		new DataView(JUN.memory.buffer).setUint32(ptr, value, true);
	},

	/**
	 * @param {number} ptr
	 * @returns {number}
	 */
	get_uint64: (ptr) => {
		return new DataView(JUN.memory.buffer).getBigUint64(ptr, true);
	},

	/**
	 * @param {number} ptr
	 * @param {number} value
	 */
	set_uint64: (ptr, value) => {
		new DataView(JUN.memory.buffer).setBigUint64(ptr, BigInt(value), true);
	},

	/**
	 * @param {number} ptr
	 * @returns {string}
	 */
	str_to_js: (ptr) => {
		const buf = new Uint8Array(JUN.memory.buffer, ptr);
		let length = 0; for (; buf[length] != 0; length++);
		return new TextDecoder().decode(buf.slice(0, length));
	},

	/**
	 * @param {number} ptr
	 * @param {string} str
	 */
	str_to_c: (ptr, str) => {
		const buf = new TextEncoder().encode(str);
		new Uint8Array(JUN.memory.buffer, ptr).set([...buf, 0]);
	},
}

export const WASI_ENV = {
	clock_time_get: (clock_id, precision, time) => {
		const now = performance.timeOrigin + performance.now();
		JUN.set_uint64(time, Math.round(now * 1000.0 * 1000.0));
		return __WASI_ERRNO_SUCCESS;
	},
	environ_get: (environ, environ_buf) => {
		return __WASI_ERRNO_SUCCESS;
	},
	environ_sizes_get: (environ_count, environ_buf_size) => {
		return __WASI_ERRNO_SUCCESS;
	},
	fd_close: (fd) => {
		delete JUN.fds[fd];
		return __WASI_ERRNO_SUCCESS;
	},
	fd_fdstat_get: (fd, buf_ptr) => {
		return __WASI_ERRNO_SUCCESS;
	},
	fd_fdstat_set_flags: (fd, flags) => {
		return __WASI_ERRNO_SUCCESS;
	},
	fd_filestat_set_size: (fd, st_size) => {
		return __WASI_ERRNO_SUCCESS;
	},
	fd_prestat_dir_name: (fd, path, path_len) => {
		if (JUN.preopen == fd) {
			JUN.str_to_c(path, '/');
			return __WASI_ERRNO_SUCCESS;
		}

		return __WASI_ERRNO_INVAL;
	},
	fd_prestat_get: (fd, buf) => {
		if (JUN.preopen == 0) {
			JUN.set_uint32(buf, 0);
			JUN.set_uint64(buf + 4, 1);
			JUN.preopen = fd;

			return __WASI_ERRNO_SUCCESS;
		}

		return __WASI_ERRNO_BADF;
	},
	fd_read: (fd, iovs, iovs_len, nread) => {
		if (fd < 3)
			return __WASI_ERRNO_BADF;

		const size = JUN.filesystem.size(JUN.fds[fd].path);
		if (size == -1)
			return __WASI_ERRNO_NOENT;

		let offset = JUN.fds[fd].offset;
		for (let x = 0; x < iovs_len; x++) {
			const ptr = iovs + x * 8;
			const buf_ptr = JUN.get_uint32(ptr);
			const buf_len = JUN.get_uint32(ptr + 4);
			const len = buf_len < size - offset ? buf_len : size - offset;

			const sab = new Uint8Array(JUN.memory.buffer, buf_ptr, len);
			JUN.filesystem.read(JUN.fds[fd].path, sab, offset);

			offset += len;
		}

		JUN.set_uint32(nread, Number(offset) - JUN.fds[fd].offset);
		JUN.fds[fd].offset = offset;

		return __WASI_ERRNO_SUCCESS;
	},
	fd_readdir: (fd, buf, buf_len, cookie, bufused) => {
		return __WASI_ERRNO_SUCCESS;
	},
	fd_seek: (fd, offset, whence, newoffset) => {
		if (fd < 3)
			return __WASI_ERRNO_SUCCESS;

		const size = JUN.filesystem.size(JUN.fds[fd].path);
		if (size == -1)
			return __WASI_ERRNO_NOENT;

		switch (whence) {
			case WHENCE_SET:
				JUN.fds[fd].offset = Number(offset);
				break;
			case WHENCE_CUR:
				JUN.fds[fd].offset += Number(offset);
				break;
			case WHENCE_END:
				JUN.fds[fd].offset = size + Number(offset);
				break;
		}

		JUN.set_uint64(newoffset, JUN.fds[fd].offset);

		return __WASI_ERRNO_SUCCESS;
	},
	fd_tell: (fd, offset) => {
		JUN.set_uint64(offset, JUN.fds[fd].offset);
		return __WASI_ERRNO_SUCCESS;
	},
	fd_write: (fd, iovs, iovs_len, nwritten) => {
		let buf_log = new Uint8Array();
		const write = fd < 3
			? (sab, offset) => buf_log = new Uint8Array([...buf_log, ...sab])
			: (sab, offset) => JUN.filesystem.write(JUN.fds[fd].path, sab, offset);

		let offset = JUN.fds[fd].offset;
		for (let x = 0; x < iovs_len; x++) {
			const ptr = iovs + x * 8;
			const buf_ptr = JUN.get_uint32(ptr);
			const buf_len = JUN.get_uint32(ptr + 4);

			write(new Uint8Array(JUN.memory.buffer, buf_ptr, buf_len), offset);

			offset += buf_len;
		}

		JUN.set_uint32(nwritten, offset - JUN.fds[fd].offset);

		switch (fd) {
			case 1:
				console.log(new TextDecoder().decode(buf_log));
				break;
			case 2:
				console.error(new TextDecoder().decode(buf_log));
				break;
			default:
				JUN.fds[fd].offset = offset;
				break;
		}

		return __WASI_ERRNO_SUCCESS;
	},
	path_filestat_get: (fd, flags, path, path_len, buf) => {
		const size = JUN.filesystem.size(JUN.str_to_js(path));
		if (size == -1)
			return __WASI_ERRNO_NOENT;

		return __WASI_ERRNO_SUCCESS;
	},
	path_open: (dirfd, dirflags, path, path_len, o_flags, fs_rights_base, fs_rights_inheriting, fs_flags, fd) => {
		if (!(o_flags & O_CREAT)) {
			const size = JUN.filesystem.size(JUN.str_to_js(path));
			if (size == -1)
				return __WASI_ERRNO_NOENT;
		}

		JUN.set_uint32(fd, JUN.next_fd);

		JUN.fds[JUN.next_fd] = {
			path: JUN.str_to_js(path),
			offset: 0,
		};

		JUN.next_fd++;

		return __WASI_ERRNO_SUCCESS;
	},
	poll_oneoff: (in_, out_, nsubscriptions, nevents) => {
		return __WASI_ERRNO_SUCCESS;
	},
	proc_exit: (code) => {
		throw `exit with exit code ${code}`;
	},
	sched_yield: () => {
		return __WASI_ERRNO_SUCCESS;
	},
};
