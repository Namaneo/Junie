import { useRef } from 'react';
import * as Helpers from '../services/helpers'

export const JunImg = ({ src }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => placeholder.current.hidden = true;
    const onError = () => image.current.hidden = true;

	return (
		<>
			{src && <img src={location.origin + '/' + src} ref={image} onLoad={onLoad} onError={onError} />}
			<img ref={placeholder} src={Helpers.getPlaceholder()} />
		</>
	);
}
