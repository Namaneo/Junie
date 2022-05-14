import { useRef } from 'react';
import * as Helpers from '../services/helpers'

export const JunImg = ({ src, className }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

	const switchImages = () => {
		image.current.hidden = false;
		placeholder.current.hidden = true;
	}

	const style = {
		verticalAlign: 'middle',
	}

	return (
		<div className={className}>
			<img hidden src={src} ref={image} onLoad={() => switchImages()} style={style} />
			<img ref={placeholder} src={Helpers.getPlaceholder()} style={style} />
		</div>
	);
}
