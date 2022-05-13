import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { JunImg } from "../components/jun-img";
import { Game } from "../entities/game";
import { useToast } from '../hooks/toast';
import * as Requests from "../services/requests";
import * as Database from "../services/database";
import './games-page.css';

export const GamesPage = ({ match }) => {

	const [system, setSystem] = useState({ games: [] });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();

	const install = async (game) => {

		const data = await Requests.fetchGame(system, game);

		if (!data) {

			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});

			return;
		}

		await Database.updateGame(new Game(data, system, game));

		system.games = system.games.filter(x => x.rom != game.rom);
		setSystem(system);

		dismiss();
		present(`${game.name} (${system.name})`);
	}

	useIonViewWillEnter(async () => {
		const system = await Requests.getSystem(match.params.system);
		let installed = await Database.getGames();
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
