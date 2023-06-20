import { IonButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { refreshOutline } from 'ionicons/icons';
import { GamesModal } from '../modals/games-modal';
import { System } from '../entities/system';
import Requests from '../services/requests';

/**
 * @returns {JSX.Element}
 */
export const InstallPage = () => {
	const [systems, setSystems] = useState(/** @type {System[]} */ ([])   );
	const [system,  setSystem]  = useState(/** @type {System}   */ (null)   );
	const [loading, setLoading] = useState(/** @type {boolean}  */ (false));

	/**
	 * @param {System} system
	 * @returns {boolean}
	 */
	const filterSystem = (system) => {
		return system.games.length && system.games.find(game => !game.installed);
	}

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

	const [open, close] = useIonModal(GamesModal, { system, close: () => close() });

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
	});

	return (
		<IonPage className="page">

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
					<IonCard key={system.name} onClick={() => showModal(system)}>
						<IonCardHeader>
							<IonCardTitle>{system.name}</IonCardTitle>
							<IonCardSubtitle>{system.core_name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
