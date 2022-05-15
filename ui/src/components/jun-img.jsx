import { IonImg } from '@ionic/react';
import { useRef } from 'react';
import * as Helpers from '../services/helpers'

export const JunImg = ({ src, style }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => placeholder.current.hidden = true;
    const onError = () => image.current.hidden = true;

	return (
		<>
			<IonImg src={src} ref={image} onIonImgDidLoad={onLoad} onIonError={onError} style={style}  />
			<IonImg ref={placeholder} src={Helpers.getPlaceholder()} style={style} />
		</>
	);
}
