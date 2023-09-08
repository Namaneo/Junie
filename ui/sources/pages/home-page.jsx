import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { informationCircleOutline, refreshOutline } from 'ionicons/icons';
import { useToast } from '../hooks/toast';
import { GamesModal } from '../modals/games-modal';
import { System } from '../entities/system';
import Requests from '../services/requests';

/**
 * @returns {JSX.Element}
 */
export const HomePage = () => {
	const [systems, setSystems] = useState(/** @type {System[]} */ ([])   );
	const [system,  setSystem]  = useState(/** @type {System}   */ (null)   );
	const [loading, setLoading] = useState(/** @type {boolean}  */ (false));

	const [open, close] = useIonModal(GamesModal, { system, close: async () => {
		setSystems(await Requests.getSystems());
		close();
	}});

	const version = window.junie_build.split('-')[0];
	const build = window.junie_build.split('-')[1];
	const date = new Date(build * 1000).toUTCString();
	const [present] = useToast(`Junie - ${version} (${build})`);

	/**
	 * @returns {Promise<void>}
	 */
	const refreshLibrary = async () => {
		setLoading(true);

		await Requests.refreshLibrary()
		setSystems(await Requests.getSystems());

		setLoading(false);
	}

	/**
	 * @param {System} system
	 * @returns {void}
	 */
	const showModal = (system) => {
		setSystem(system);
		open({ cssClass: 'fullscreen' });
	}

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
	});

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonTitle>Junie</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => present(date)}>
							<IonIcon slot="icon-only" icon={informationCircleOutline} />
						</IonButton>
						<IonButton onClick={refreshLibrary}>
							<IonIcon slot="icon-only" icon={refreshOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="home">
				<IonLoading isOpen={loading} message="Refreshing..." spinner={null} />
				{systems.map(system =>
					<IonCard key={system.name} onClick={() => showModal(system)}>
						<IonCardHeader>
							<IonCardTitle>{system.name}</IonCardTitle>
							<IonCardSubtitle>{system.core_name} - {system.games.length} game{system.games.length > 1 && 's'}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
