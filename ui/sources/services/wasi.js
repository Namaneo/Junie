import Filesystem from './filesystem';

export default class WASI {
	get #WASI_ERRNO_SUCCESS() { return 0; }
	get #WASI_ERRNO_BADF()    { return 8; }
	get #WASI_ERRNO_INVAL()   { return 28; }
	get #WASI_ERRNO_NOENT()   { return 44; }

	get #WASI_EVENTTYPE_CLOCK() { return 0; }

	get #WHENCE_SET() { return 0; }
	get #WHENCE_CUR() { return 1; }
	get #WHENCE_END() { return 2; }

	get #O_CREAT() { return 9; }

	/** @type {WebAssembly.Memory} */
	#memory = null;

	/** @type {Filesystem} */
	#filesystem = null;

	/** @type {number} */
	#preopen = 0;

	/** @type {Int32Array} */
	#sab = new Int32Array(new SharedArrayBuffer(4));

	/** @type {number} */
	#next_fd = 3;

	/** @type {{path: string, offset: number}[]} */
	#fds = [
		{ path: 'stdin',  offset: 0 },
		{ path: 'stdout', offset: 0 },
		{ path: 'stderr', offset: 0 },
	];

	/** @type {{path: string, offset: number}[]} */
	get fds() { return this.#fds; }

	/**
	 * @param {WebAssembly.Memory} memory
	 * @param {Filesystem} filesystem
	 * @param {{path: string, offset: number}[]} fds
	 */
	constructor(memory, filesystem, fds) {
		this.#memory = memory;
		this.#filesystem = filesystem;
		this.#fds = { ...this.#fds, ...(fds ?? []) };
	}

	/**
	 * @param {number} ptr
	 * @returns {number}
	 */
	#get_uint32(ptr) {
		return new DataView(this.#memory.buffer).getUint32(ptr, true);
	}

	/**
	 * @param {number} ptr
	 * @param {number} value
	 */
	#set_uint32(ptr, value) {
		new DataView(this.#memory.buffer).setUint32(ptr, value, true);
	}

	/**
	 * @param {number} ptr
	 * @returns {number}
	 */
	#get_uint64(ptr) {
		return new DataView(this.#memory.buffer).getBigUint64(ptr, true);
	}

	/**
	 * @param {number} ptr
	 * @param {number} value
	 */
	#set_uint64(ptr, value) {
		new DataView(this.#memory.buffer).setBigUint64(ptr, BigInt(value), true);
	}

	/**
	 * @param {number} ptr
	 * @returns {string}
	 */
	#str_to_js(ptr) {
		const buf = new Uint8Array(this.#memory.buffer, ptr);
		let length = 0; for (; buf[length] != 0; length++);
		return new TextDecoder().decode(buf.slice(0, length));
	}

	/**
	 * @param {number} ptr
	 * @param {string} str
	 */
	#str_to_c(ptr, str) {
		const buf = new TextEncoder().encode(str);
		new Uint8Array(this.#memory.buffer, ptr).set([...buf, 0]);
	}

	get environment() {
		return {
			clock_time_get: (clock_id, precision, time) => {
				const now = performance.timeOrigin + performance.now();
				this.#set_uint64(time, Math.round(now * 1000.0 * 1000.0));
				return this.#WASI_ERRNO_SUCCESS;
			},
			environ_get: (environ, environ_buf) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			environ_sizes_get: (environ_count, environ_buf_size) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_close: (fd) => {
				delete this.#fds[fd];
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_fdstat_get: (fd, buf_ptr) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_fdstat_set_flags: (fd, flags) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_filestat_get: (fd, buf) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_filestat_set_size: (fd, st_size) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_prestat_dir_name: (fd, path, path_len) => {
				if (this.#preopen == fd) {
					this.#str_to_c(path, '/');
					return this.#WASI_ERRNO_SUCCESS;
				}

				return this.#WASI_ERRNO_INVAL;
			},
			fd_prestat_get: (fd, buf) => {
				if (this.#preopen == 0) {
					this.#set_uint32(buf, 0);
					this.#set_uint64(buf + 4, 1);
					this.#preopen = fd;

					return this.#WASI_ERRNO_SUCCESS;
				}

				return this.#WASI_ERRNO_BADF;
			},
			fd_readdir: (fd, buf, buf_len, cookie, bufused) => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_seek: (fd, offset, whence, newoffset) => {
				if (fd < 3)
					return this.#WASI_ERRNO_SUCCESS;

				const size = this.#filesystem.size(this.#fds[fd].path);
				if (size == -1)
					return this.#WASI_ERRNO_NOENT;

				switch (whence) {
					case this.#WHENCE_SET:
						this.#fds[fd].offset = Number(offset);
						break;
					case this.#WHENCE_CUR:
						this.#fds[fd].offset += Number(offset);
						break;
					case this.#WHENCE_END:
						this.#fds[fd].offset = size + Number(offset);
						break;
				}

				this.#set_uint64(newoffset, this.#fds[fd].offset);

				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_tell: (fd, offset) => {
				this.#set_uint64(offset, this.#fds[fd].offset);
				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_pread: (fd, iovs, iovs_len, offset, nread) => {
				if (fd < 3)
					return this.#WASI_ERRNO_BADF;

				const size = this.#filesystem.size(this.#fds[fd].path);
				if (size == -1)
					return this.#WASI_ERRNO_NOENT;

				const orig_offset = offset;
				for (let x = 0; x < iovs_len; x++) {
					const ptr = iovs + x * 8;
					const buf_ptr = this.#get_uint32(ptr);
					const buf_len = this.#get_uint32(ptr + 4);
					const len = buf_len < size - offset ? buf_len : size - offset;

					const sab = new Uint8Array(this.#memory.buffer, buf_ptr, len);
					this.#filesystem.read(this.#fds[fd].path, sab, offset);

					offset += len;
				}

				this.#set_uint32(nread, offset - orig_offset);

				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_read: (fd, iovs, iovs_len, nread) => {
				const errno = this.environment.fd_pread(fd, iovs, iovs_len, this.#fds[fd].offset, nread);
				if (errno == this.#WASI_ERRNO_SUCCESS)
					this.#fds[fd].offset += this.#get_uint32(nread);
				return errno;
			},
			fd_pwrite: (fd, iovs, iovs_len, offset, nwritten) => {
				let buf_log = new Uint8Array();
				const write = fd < 3
					? (sab, offset) => buf_log = new Uint8Array([...buf_log, ...sab])
					: (sab, offset) => this.#filesystem.write(this.#fds[fd].path, sab, offset);

				const orig_offset = offset;
				for (let x = 0; x < iovs_len; x++) {
					const ptr = iovs + x * 8;
					const buf_ptr = this.#get_uint32(ptr);
					const buf_len = this.#get_uint32(ptr + 4);

					write(new Uint8Array(this.#memory.buffer, buf_ptr, buf_len), offset);

					offset += buf_len;
				}

				this.#set_uint32(nwritten, offset - orig_offset);

				switch (fd) {
					case 1:
						const log = new TextDecoder().decode(buf_log).trim();
						if (log) console.log(log);
						break;
					case 2:
						const error = new TextDecoder().decode(buf_log).trim();
						if (error) console.error(error);
						break;
				}

				return this.#WASI_ERRNO_SUCCESS;
			},
			fd_write: (fd, iovs, iovs_len, nwritten) => {
				const errno = this.environment.fd_pwrite(fd, iovs, iovs_len, this.#fds[fd].offset, nwritten)
				if (errno == this.#WASI_ERRNO_SUCCESS && fd > 2)
					this.#fds[fd].offset += this.#get_uint32(nwritten);
				return errno;
			},
			path_filestat_get: (fd, flags, path, path_len, buf) => {
				const size = this.#filesystem.size(this.#str_to_js(path));
				if (size == -1)
					return this.#WASI_ERRNO_NOENT;

				return this.#WASI_ERRNO_SUCCESS;
			},
			path_open: (dirfd, dirflags, path, path_len, o_flags, fs_rights_base, fs_rights_inheriting, fs_flags, fd) => {
				if (!(o_flags & this.#O_CREAT)) {
					const size = this.#filesystem.size(this.#str_to_js(path));
					if (size == -1)
						return this.#WASI_ERRNO_NOENT;
				}

				this.#set_uint32(fd, this.#next_fd);

				this.#fds[this.#next_fd] = {
					path: this.#str_to_js(path),
					offset: 0,
				};

				this.#next_fd++;

				return this.#WASI_ERRNO_SUCCESS;
			},
			poll_oneoff: (in_, out_, nsubscriptions, nevents) => {
				if (this.#get_uint32(in_ + 8) == this.#WASI_EVENTTYPE_CLOCK)
					Atomics.wait(this.#sab, 0, 0, Number(this.#get_uint64(in_ + 24)) / 1000000);
				this.#set_uint32(out_ + 8, 0);
				return this.#WASI_ERRNO_SUCCESS;
			},
			proc_exit: (code) => {
				throw `exit with exit code ${code}`;
			},
			sched_yield: () => {
				return this.#WASI_ERRNO_SUCCESS;
			},
			random_get: (buf, buf_len, a) => {
				const values = crypto.getRandomValues(new Uint8Array(buf_len));
				new Uint8Array(this.#memory.buffer, buf, buf_len).set(values);
				return this.#WASI_ERRNO_SUCCESS;
			},
		};
	}
}
