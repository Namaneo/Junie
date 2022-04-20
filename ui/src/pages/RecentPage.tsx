import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { JunImg } from '../components/JunImg';
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
			if (!system || !system.games)
				continue;

			let game = system.games.find(game => game.rom == cachedGame.game);
			if (!game) {
				game = {
					name: cachedGame.game.split('.').slice(0, -1).join('.'),
					rom: cachedGame.game,
					cover: 'assets/placeholder.png'
				}
			}

			played.push({ request: cachedGame.request, system, game });
		}

		setPlayed(played);
		setLoading(false);
	}

	const addGame = async (files: FileList | null) => {
		if (!files?.length)
			return;

		const system = await Requests.getSystemByGame(files[0].name);

		await Caches.add(
			new Request(`/app/games/${system.name}/${files[0].name}`),
			new Response(await files[0].arrayBuffer())
		);

		await retrieveGames();
	}

	const deleteGame = async (request: Request) => {
		await Caches.remove(request);

		await retrieveGames();
	}

	useIonViewWillEnter(retrieveGames);

	const fileInput = useRef<HTMLInputElement>(null);

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Recent</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => fileInput?.current?.click()}>
							<input type="file" ref={fileInput} onChange={e => addGame(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="recent-page">
				<IonLoading isOpen={loading} />

				<IonList>
					<IonItemGroup>
						{played.map(played =>
							<IonItemSliding key={played.game.rom}>
								<IonItem lines="full" className="game">
									<JunImg className="cover" src={played.game.cover} />
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
