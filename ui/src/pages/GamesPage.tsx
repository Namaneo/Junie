import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonImg, IonLoading, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { RouteComponentProps } from "react-router";
import { JunImg } from "../components/JunImg";
import { useToast } from '../hooks/Toast';
import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";
import Caches from "../services/Caches";
import Requests from "../services/Requests";
import './GamesPage.scss';

interface GamesProps {
	system: string;
}

export const GamesPage: React.FC<RouteComponentProps<GamesProps>> = ({ match }) => {

	const [loading, setLoading] = useState<boolean>(true)
	const [system, setSystem] = useState<System>({ games: [] });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();


	const install = async (game: Game) => {
		setLoading(true);

		const installed = await Requests.installGame(system, game);

		if (!installed) {

			setLoading(false);
			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});

			return;
		}

		system.games = system.games.filter(x => x != game);
		setSystem(system);
		setLoading(false);

		dismiss();
		present(`${game.name} (${system.name})`);
	}

	useIonViewWillEnter(async () => {
		setLoading(true);

		const system = await Requests.getSystem(match.params.system);
		let installed = await Caches.getGames();
		installed = installed.filter(x => x.system == system.name);

		system.games = system.games?.filter(game =>
			!installed.find(x => x.game == game.rom)
		);

		setSystem(system);
		setLoading(false);
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

			<IonContent className="games-page">
				<IonLoading isOpen={loading} />
				{system.games?.map(game =>
					<IonCard className="card" onClick={() => install(game)}>
						<JunImg className="cover" src={game.cover} />
						<IonCardHeader className="header">
							<IonCardSubtitle>{game.name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
