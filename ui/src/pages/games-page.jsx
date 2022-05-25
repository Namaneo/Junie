import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { useToast } from '../hooks/toast';
import { Game } from "../entities/game";
import { JunImg } from "../components/jun-img";
import * as Requests from "../services/requests";
import * as Database from "../services/database";
import * as Helpers from "../services/helpers";

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

		if (game.cover) {
			const response = await fetch(game.cover);
			const buffer = await response.arrayBuffer();
			const cover = Helpers.From.ArrayBuffer(buffer);
			const contentType = response.headers.get("Content-Type");
			game.cover = Helpers.To.DataURL(cover, contentType);
		}

		await Database.addGame(new Game(system, game), data);

		system.games = system.games.filter(x => x.rom != game.rom);
		setSystem({ ...system });

		dismiss();
		present(`${game.name} (${system.name})`);

		setLoading(false);
	}

	useIonViewWillEnter(async () => {
		setSystem(await Requests.getSystem(match.params.system));
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

			<IonContent class="games">
				<IonLoading isOpen={loading} message="Installing..." spinner={null} />
				{system.games.filter(game => !game.installed).map(game =>
					<IonCard key={game.rom} onClick={() => install(game)}>
						<JunImg system={system} game={game} />
						<IonCardHeader>
							<IonCardSubtitle>{game.name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
