function event(type, data) {
	return new Promise(resolve => {
		const id = Math.random().toString(36).substring(2);

		const callback = e => {
			window.removeEventListener(id, callback);
			resolve(e.detail);
		};

		window.addEventListener(id, callback);
		window.external.invoke(JSON.stringify({ id, type, data }));
	});
};

export default {
	get_version:   (data) => event('get_version',   data),
	prepare_game:  (data) => event('prepare_game',  data),
	start_game:    (data) => event('start_game',    data),
	clear_game:    (data) => event('clear_game',    data),
	get_languages: (data) => event('get_languages', data),
	get_bindings:  (data) => event('get_bindings',  data),
	get_settings:  (data) => event('get_settings',  data),
};