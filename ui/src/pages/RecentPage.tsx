import { IonButton, IonContent, IonHeader, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';
import Caches from '../services/Caches';
import Requests from '../services/Requests';
import './RecentPage.scss';

interface PlayedGame {
	request: Request,
	system: System,
	game: Game
}

export const RecentPage: React.FC = () => {

	const [loading, setLoading] = useState<boolean>(true)
	const [played, setPlayed] = useState<PlayedGame[]>([])

	const retrieveGames = async () => {
		setLoading(true);

		const systems = await Requests.getSystems();
		const cachedGames = await Caches.getGames();

		const played = [];

		for (const cachedGame of cachedGames) {
			const system = systems.find(system => system.name == cachedGame.system);
			if (!system)
				continue;

			const game = system.games.find(game => game.rom == cachedGame.game);
			if (!game)
				continue;

			played.push({ request: cachedGame.request, system, game });
		}

		setPlayed(played);
		setLoading(false);
	}

	const deleteGame = async (request: Request) => {
		await Caches.remove(request);

		await retrieveGames();
	}

	useIonViewWillEnter(retrieveGames);

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Recent</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="recent-page">
				<IonLoading isOpen={loading} />

				<IonList>
					<IonItemGroup>
						{played.map(played =>
							<IonItemSliding key={played.game.rom}>
								<IonItem lines="full" className="game">
									<img src={played.game.cover} />
									<IonLabel className="label">
										<h2>{played.game.name}</h2>
										<h3>{played.system.name}</h3>
									</IonLabel>
									<IonButton href={`app/#/${played.system.name}/${played.game.rom}`}>Play</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteGame(played.request)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						)}
					</IonItemGroup>
				</IonList>

			</IonContent>

		</IonPage>
	);
};
