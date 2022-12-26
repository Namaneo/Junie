function get_size(c_width, c_height) {
	const rect = Module.canvas.getBoundingClientRect();

	Module.canvas.width = rect.width;
	Module.canvas.height = rect.height;

	const view = new DataView(wasmMemory.buffer);
	view.setInt32(c_width, rect.width, true);
	view.setInt32(c_height, rect.height, true);
}

mergeInto(LibraryManager.library, {
	get_size: get_size,
});
