import { useRef } from 'react';
import * as Helpers from '../services/helpers'
import cover_placeholder from '../../res/placeholder.png'

const placeholder_url = Helpers.createObjectUrl(cover_placeholder);

export const JunImg = ({ src }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => {
		placeholder.current.hidden = true;
		image.current.hidden = false;
	};

	if (src && !src.startsWith('http'))
		src = location.origin + '/' + src;

	return (
		<>
			{src && <img src={src} ref={image} hidden onLoad={onLoad} />}
			<img ref={placeholder} src={placeholder_url} />
		</>
	);
}
