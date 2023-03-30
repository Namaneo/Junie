import { useRef, useState } from 'react';
import Requests from '../services/requests';
import Helpers from '../services/helpers';
import cover_placeholder from '../../assets/placeholder.png';

const placeholder_url = Helpers.createObjectUrl(cover_placeholder);

export const JunImg = ({ system, game }) => {

	const [local] = useState(game.cover);
	const [remote] = useState(Requests.getGameCover(system, game));

	const [source, setSource] = useState(local);

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => {
		game.cover = source;
		placeholder.current.hidden = true;
		image.current.hidden = false;
	};

	const onError = () => {
		setSource(source != remote ? remote : null);
	}

	game.cover = source;
	if (game.cover) {
		const isHttp  = source.startsWith('http:');
		const isHttps = source.startsWith('https:');
		const isBlob  = source.startsWith('blob:');
		const isData  = source.startsWith('data:');

		if (!isHttp && !isHttps && !isBlob && !isData)
			game.cover = location.origin + '/' + game.cover;

		if (isData)
			game.cover = Helpers.createObjectUrl(game.cover);
	}

	return (
		<>
			{local && <img src={game.cover} ref={image} hidden onLoad={onLoad} onError={onError} />}
			<img ref={placeholder} src={placeholder_url} />
		</>
	);
}
