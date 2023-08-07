export default class WorkerMessage {
	static get TYPE_NUMBER() { return 1; }
	static get TYPE_STRING() { return 2; }
	static get TYPE_OBJECT() { return 3; }

	/**
	 * @param {SharedArrayBuffer} sab
	 * @param {any} result
	 */
	static serialize(sab, result) {
		switch (typeof result) {
			case 'number':
				Atomics.store(sab, 1, this.TYPE_NUMBER);
				Atomics.store(sab, 2, result);
				break;
			case 'string':
				const encoded_str = new TextEncoder().encode(result);
				sab.buffer.grow(sab.byteLength + encoded_str.byteLength);

				Atomics.store(sab, 1, this.TYPE_STRING);
				Atomics.store(sab, 2, encoded_str.byteLength);
				new Uint8Array(sab.buffer).set(encoded_str, 12);
				break;
			case 'object':
				const encoded_obj = new TextEncoder().encode(JSON.stringify(result));
				sab.buffer.grow(sab.byteLength + encoded_obj.byteLength);

				Atomics.store(sab, 1, this.TYPE_OBJECT);
				Atomics.store(sab, 2, encoded_obj.byteLength);
				new Uint8Array(sab.buffer).set(encoded_obj, 12);
				break;
		}
	}

	/**
	 * @param {SharedArrayBuffer} sab
	 * @returns {any}
	 */
	static parse(sab) {
		switch (sab[1]) {
			case this.TYPE_NUMBER:
				return sab[2];
			case this.TYPE_STRING:
				const str_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
				return new TextDecoder().decode(str_buf);
			case this.TYPE_OBJECT:
				const obj_buf = new Uint8Array(sab.buffer, 12, sab[2]).slice();
				return JSON.parse(new TextDecoder().decode(obj_buf));
		}
	}
}
