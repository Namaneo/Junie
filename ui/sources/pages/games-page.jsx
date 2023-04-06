import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonItem, IonLabel, IonLoading, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { useToast } from '../hooks/toast';
import { Game } from '../entities/game';
import { JunImg } from '../components/jun-img';
import Requests from '../services/requests';
import Helpers from '../services/helpers';
import Files from '../services/files';

export const GamesPage = ({ match }) => {

	const [loading, setLoading] = useState(false);
	const [system, setSystem] = useState({ games: [] });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();

	const install = async (game) => {
		setLoading(true);

		const data = await Requests.fetchGame(system, game);

		if (!data) {
			setLoading(false);
			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});
			return;
		}

		game.cover = await Helpers.requestDataURL(game.cover);

		await Files.Games.add(new Game(system, game), data);

		system.games = system.games.filter(x => x.rom != game.rom);
		setSystem({ ...system });

		dismiss();
		present(`${game.name} (${system.name})`);

		setLoading(false);
	}

	useIonViewWillEnter(async () => {
		const systems = await Requests.getSystems();
		setSystem(systems.find(x => x.name == match.params.system));
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Games</IonTitle>
					<IonButtons slot="start">
						<IonBackButton />
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="games">
				<IonLoading isOpen={loading} message="Installing..." spinner={null} />
				{system.games.filter(game => !game.installed).map(game =>
					<IonCard key={game.rom} onClick={() => install(game)}>
						<IonItem color="light">
							<JunImg system={system} game={game} />
							<IonLabel>
								<h2>{game.name}</h2>
							</IonLabel>
						</IonItem>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
