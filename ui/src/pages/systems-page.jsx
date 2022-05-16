import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonImg, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Requests from '../services/requests';
import * as Helpers from '../services/helpers';

export const SystemsPage = () => {

	const [systems, setSystems] = useState([]);

	useIonViewWillEnter(async () => {
		const systems = await Requests.getSystems();

		setSystems(systems);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Systems</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent class="systems">
				{systems.filter(x => x.games && x.games.length).map(system =>
					<IonCard key={system.name} routerLink={`/games/${system.name}`}>
						<IonImg src={Helpers.getSystemCover(system)} />
						<IonCardHeader>
							<IonCardSubtitle>{system.coreName}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
