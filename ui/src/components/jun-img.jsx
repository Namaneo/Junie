import { useRef, useState } from 'react';
import * as Requests from '../services/requests'
import * as Helpers from '../services/helpers'
import cover_placeholder from '../../res/placeholder.png'

const placeholder_url = Helpers.createObjectUrl(cover_placeholder);

export const JunImg = ({ system, game }) => {

	const [local] = useState(game.cover);
	const [remote] = useState(Requests.getGameCover(system, game));

	const [source, setSource] = useState(local);

	const image = useRef(null);
	const placeholder = useRef(null);

	game.cover = source;

    const onLoad = () => {
		game.cover = source;
		placeholder.current.hidden = true;
		image.current.hidden = false;
	};

	const onError = () => {
		setSource(source != remote ? remote : null);
	}

	const src = source && !source.startsWith('http') ? location.origin + '/' + source : source;

	return (
		<>
			{local && <img src={src} ref={image} hidden onLoad={onLoad} onError={onError} />}
			<img ref={placeholder} src={placeholder_url} />
		</>
	);
}
