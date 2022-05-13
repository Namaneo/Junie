import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { JunImg } from "../components/jun-img";
import { useToast } from '../hooks/toast';
import * as Caches from "../services/caches";
import * as Requests from "../services/requests";
import './games-page.css';

export const GamesPage = ({ match }) => {

	const [system, setSystem] = useState({ games: [] });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();


	const install = async (game) => {

		const installed = await Requests.installGame(system, game);

		if (!installed) {

			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});

			return;
		}

		system.games = system.games.filter(x => x != game);
		setSystem(system);

		dismiss();
		present(`${game.name} (${system.name})`);
	}

	useIonViewWillEnter(async () => {
		const system = await Requests.getSystem(match.params.system);
		let installed = await Caches.getGames();
		installed = installed.filter(x => x.system == system.name);

		system.games = system.games?.filter(game =>
			!installed.find(x => x.game == game.rom)
		);

		setSystem(system);
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
