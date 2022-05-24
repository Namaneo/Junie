import { useRef, useState } from 'react';
import * as Helpers from '../services/helpers'
import cover_placeholder from '../../res/placeholder.png'

const placeholder_url = Helpers.createObjectUrl(cover_placeholder);

export const JunImg = ({ local, remote }) => {

	const [source, setSource] = useState(local ?? remote);

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => {
		placeholder.current.hidden = true;
		image.current.hidden = false;
	};

	const onError = () => {
		if (remote && source != remote)
			setSource(remote);
	}

	const src = source && !source.startsWith('http') ? location.origin + '/' + source : source;

	return (
		<>
			{src && <img src={src} ref={image} hidden onLoad={onLoad} onError={onError} />}
			<img ref={placeholder} src={placeholder_url} />
		</>
	);
}
