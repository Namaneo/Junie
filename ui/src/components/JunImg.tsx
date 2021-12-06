import { useRef } from "react";
import './JunImg.scss';

interface JunImgProps {
	src?: string;
	className?: string;
}

export const JunImg: React.FC<JunImgProps> = ({ src, className }) => {

	const image = useRef<HTMLImageElement>(null);
	const placeholder = useRef<HTMLImageElement>(null);

	const switchImages = () => {
		image.current!.hidden = false;
		placeholder.current!.hidden = true;
	}

	return (
		<div className={className}>
				<img hidden src={src} ref={image} onLoad={() => switchImages()} />
				<img ref={placeholder} src="assets/placeholder.png" />
		</div>
	);
}
