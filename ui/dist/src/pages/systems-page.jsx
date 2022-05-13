import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonImg, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { JunImg } from '../components/jun-img';
import * as Requests from '../services/requests';
import * as Helpers from '../services/helpers';
import './systems-page.css';

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

			<IonContent className="systems-page">
				{systems.filter(x => x.games && x.games.length).map(system =>
					<IonCard className="card" key={system.name} routerLink={`/games/${system.name}`}>
						<IonImg className="cover" src={Helpers.getSystemCover(system)} />
						<IonCardHeader>
							<IonCardSubtitle>{system.coreName}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
};
