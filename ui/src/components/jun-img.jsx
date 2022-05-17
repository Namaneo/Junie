import { IonImg } from '@ionic/react';
import { useRef } from 'react';
import * as Helpers from '../services/helpers'

export const JunImg = ({ src }) => {

	const image = useRef(null);
	const placeholder = useRef(null);

    const onLoad = () => placeholder.current.hidden = true;
    const onError = () => image.current.hidden = true;

	return (
		<>
			{src && <IonImg src={location.origin + '/' + src} ref={image} onIonImgDidLoad={onLoad} onIonError={onError} />}
			<IonImg ref={placeholder} src={Helpers.getPlaceholder()} />
		</>
	);
}
