import { useRef } from "react";

export const JunImg = ({ src, className }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

	const switchImages = () => {
		image.current.hidden = false;
		placeholder.current.hidden = true;
	}

	return (
		<div className={className}>
				<img hidden src={src} ref={image} onLoad={() => switchImages()} />
				<img ref={placeholder} src="assets/placeholder.png" />
		</div>
	);
}
