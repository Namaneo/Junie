import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { refreshOutline } from 'ionicons/icons';
import * as Requests from '../services/requests';

export const SystemsPage = () => {

	const [systems, setSystems] = useState([]);

	const filterSystem = (system) => {
		return system.games.length && !system.games.find(game => game.installed);
	}

	useIonViewWillEnter(async () => {
		const systems = await Requests.getSystems();

		setSystems(systems);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Systems</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => Requests.initialize()}>
							<IonIcon slot="icon-only" icon={refreshOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="systems">
				{systems.filter(filterSystem).map(system =>
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
