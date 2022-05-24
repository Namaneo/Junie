import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Requests from '../services/requests';

export const SystemsPage = () => {

	const [systems, setSystems] = useState([]);

	useIonViewWillEnter(async () => {
		const systems = await Requests.getFilteredSystems();

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
				{systems.map(system =>
					<IonCard key={system.name} routerLink={`/games/${system.name}`}>
						<img src={Requests.getSystemCover(system)} />
						<IonCardHeader>
							<IonCardSubtitle>{system.core_name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
