import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonImg, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { System } from '../interfaces/System';
import Requests from '../services/Requests';
import './SystemsPage.scss';

export const SystemsPage: React.FC = () => {

	const [loading, setLoading] = useState<boolean>(true);
	const [systems, setSystems] = useState<System[]>([]);

	useIonViewWillEnter(async () => {
		setLoading(true);

		const systems = await Requests.getSystems();

		setSystems(systems);
		setLoading(false);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Systems</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="systems-page">
				<IonLoading isOpen={loading} />
				{systems.filter(x => x.games?.length).map(system =>
					<IonCard className="card" key={system.name} routerLink={`/games/${system.name}`}>
						<IonImg class="cover" src={Requests.getSystemCover(system)} />
						<IonCardHeader>
							<IonCardSubtitle>{system.coreName}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
