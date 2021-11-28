import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewWillEnter, useIonViewWillLeave } from "@ionic/react";
import { RouteComponentProps } from "react-router";
import Events from "../services/Events";
import './EmulatorPage.scss';

interface EmulatorProps {
	system: string;
	game: string;
}

export const EmulatorPage: React.FC<RouteComponentProps<EmulatorProps>> = ({ match }) => {

	window.addEventListener('keydown', ev => {
		const { key, code } = ev;
		const frame = window.frames[0];
		frame.dispatchEvent(new KeyboardEvent('keydown', { key, code }))
	});

	window.addEventListener('keyup', ev => {
		const { key, code } = ev;
		const frame = window.frames[0];
		frame.dispatchEvent(new KeyboardEvent('keyup', { key, code }))
	});

	useIonViewWillEnter(() => Events.next('tabs', false));
	useIonViewWillLeave(() => Events.next('tabs', true));

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>{match.params.system}</IonTitle>
					<IonButtons slot="start">
						<IonBackButton />
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<iframe className="emulator" src={`app/#/${match.params.system}/${match.params.game}`}></iframe>
			</IonContent>

		</IonPage>
	);
}
