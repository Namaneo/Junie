import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { refreshOutline } from 'ionicons/icons';
import { useOnline } from '../hooks/online';
import Requests from '../services/requests';

export const SystemsPage = () => {

	const [systems, setSystems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [alert] = useIonAlert();
	const online = useOnline();

	const filterSystem = (system) => {
		return system.games.length && system.games.find(game => !game.installed);
	}

	const refreshLibrary = async () => {
		setLoading(true);

		const success = await Requests.refreshLibrary();
		if (!success) {
			setLoading(false);
			alert({
				header: 'Refresh failed',
				message: `Could not refreh the library. Please check you internet connection.`,
				buttons: [ 'OK' ],
			});
			return;
		}

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

			<IonContent className="systems">
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
