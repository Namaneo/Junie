import { IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { trash } from 'ionicons/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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

	const deleteGame = async (event: React.MouseEvent, request: Request) => {
		event.stopPropagation();
		event.preventDefault();

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
				{played.map(played =>
					<Link className="game" key={played.game.name} to={`/games/${played.system.name}/${played.game.rom}`}>
						<IonCard className="card">
							<img src={played.game.cover} />
							<IonCardHeader class="header">
								<IonCardSubtitle>{played.game.name}</IonCardSubtitle>
							</IonCardHeader>
							<IonButton fill="clear" color="danger" onClick={e => deleteGame(e, played.request)}>
								<IonIcon icon={trash} />
							</IonButton>
						</IonCard>
					</Link>
				)}
			</IonContent>

		</IonPage>
	);
};
