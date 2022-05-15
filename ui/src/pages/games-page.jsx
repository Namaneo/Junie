import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonImg, IonLoading, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { useToast } from '../hooks/toast';
import { Game } from "../entities/game";
import { JunImg } from "../components/jun-img";
import * as Requests from "../services/requests";
import * as Database from "../services/database";

export const GamesPage = ({ match }) => {

	const [loading, setLoading] = useState(false);
	const [system, setSystem] = useState({ games: [] });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();

	const install = async (game) => {
		setLoading(true);

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
		setSystem({ ...system });

		dismiss();
		present(`${game.name} (${system.name})`);

		setLoading(false);
	}

	useIonViewWillEnter(async () => {
		const system = await Requests.getSystem(match.params.system);
		let installed = await Database.getGames();
		installed = installed.filter(x => x.system.name == system.name);

		system.games = system.games.filter(game =>
			!installed.find(x => x.game.rom == game.rom)
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

			<IonContent>
				<IonLoading isOpen={loading} message="Installing..." spinner={null} />
				{system.games?.map(game =>
					<IonCard key={game.rom} onClick={() => install(game)} style={{ display: 'flex', cursor: 'pointer' }}>
						<JunImg src={game.cover} style={{ maxWidth: '25%' }} />
						<IonCardHeader style={{ display: 'flex', alignItems: 'center' }}>
							<IonCardSubtitle>{game.name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
