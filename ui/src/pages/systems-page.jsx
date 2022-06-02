import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { refreshOutline } from 'ionicons/icons';
import { useOnline } from '../hooks/online'
import * as Requests from '../services/requests';

export const SystemsPage = () => {

	const [systems, setSystems] = useState([]);
	const [loading, setLoading] = useState(false);
	const online = useOnline();

	const filterSystem = (system) => {
		return system.games.length && system.games.find(game => !game.installed);
	}

	const refreshLibrary = async () => {
		setLoading(true);

		await Requests.refreshLibrary();
		setSystems(await Requests.getSystems());

		setLoading(false);
	}

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Systems</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={refreshLibrary} hidden={!online}>
							<IonIcon slot="icon-only" icon={refreshOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="systems">
				<IonLoading isOpen={loading} message="Refreshing..." spinner={null} />
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
