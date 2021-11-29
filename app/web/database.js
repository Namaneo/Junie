let database;
let files = {};

const request = window.indexedDB.open('Junie', 10);

//Check if a schema update is required
request.onupgradeneeded = event => {
	const database = event.target.result;

	if (event.oldVersion < 1) {
		database.createObjectStore('files', { keyPath: 'path', unique: true });
	}
};

//Print error if anything wrong happens
request.onerror = event => console.log(event);

//Retrieve all files in memory
request.onsuccess = event => {
	database = event.target.result;

	const transaction = database.transaction('files', 'readwrite');
	const store = transaction.objectStore('files');

	store.getAll().onsuccess = event => {
		for (const file of event.target.result) {
			files[file.path] = mty_b64_to_buf(file.data);
		}
	}
};

//Read a file from memory storage
function JUN_ReadFile(path, length) {
	const file = files[MTY_StrToJS(path)];
	if (!file)
		return null;

	const result = MTY_Alloc(file.length, 1);
	const view = new Uint8Array(mty_mem(), result, file.length);
	view.set(file);

	MTY_SetUint32(length, file.length);

	return result;
}

//Write a file to the database
function JUN_WriteFile(cpath, cdata, length) {
	const transaction = database.transaction('files', 'readwrite');
	const store = transaction.objectStore('files');

	const buffer = new Uint8Array(length);
	const data = new Uint8Array(mty_mem(), cdata, length);
	buffer.set(data);

	const path = MTY_StrToJS(cpath)

	files[path] = data;

	store.put({ path: path, data: mty_buf_to_b64(data) });
}