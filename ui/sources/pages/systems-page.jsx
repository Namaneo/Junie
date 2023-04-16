import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { refreshOutline } from 'ionicons/icons';
import { System } from '../entities/system';
import Requests from '../services/requests';

export const SystemsPage = () => {

	const [systems, setSystems] = useState(/** @type {System[]} */ ([])   );
	const [loading, setLoading] = useState(/** @type {boolean}  */ (false));

	const filterSystem = (system) => {
		return system.games.length && system.games.find(game => !game.installed);
	}

	const refreshLibrary = async () => {
		setLoading(true);

		await Requests.refreshLibrary()
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
						<IonButton onClick={refreshLibrary}>
							<IonIcon slot="icon-only" icon={refreshOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="systems">
				<IonLoading isOpen={loading} message="Refreshing..." spinner={null} />
				{systems.filter(filterSystem).map(system =>
					<IonCard key={system.name} routerLink={`/games/${system.name}`}>
						<img src={system.cover} style={{filter: Requests.shouldInvertCover(system) && 'invert(1)'}} />
						<IonCardHeader>
							<IonCardSubtitle>{system.core_name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
