import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar, useIonToast, useIonViewWillEnter } from "@ionic/react";
import { checkmarkSharp } from "ionicons/icons";
import { useState } from "react";
import { RouteComponentProps } from "react-router";
import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";
import Requests from "../services/Requests";
import './GamesPage.scss';

interface GamesProps {
	system: string;
}

export const GamesPage: React.FC<RouteComponentProps<GamesProps>> = ({ match }) => {

	const [loading, setLoading] = useState<boolean>(true)
	const [system, setSystem] = useState<System>({ games: [] });
	const [queue, setQueue] = useState<string[]>([]);

	const [present, dismiss] = useIonToast();

	const installed = () => {
		if (!queue.length)
			return;

		const game = queue[0];

		setTimeout(() => present({
			header: 'Game successfully installed!',
			message: `${game} (${system.name})`,
			duration: 2000,
			position: "top",
			buttons: [{ icon: checkmarkSharp, role: 'cancel' }],
			onDidDismiss: () => {
				queue.shift();
				setQueue(queue);

				installed();
			}
		}));
	}

	const install = async (game: Game) => {
		setLoading(true);

		const path = `/app/games/${system.name}/${game.rom}`;
		await fetch(path).then(response => response.arrayBuffer());

		setLoading(false);

		queue.push(game.name!);
		setQueue(queue);

		dismiss()
		if (queue.length == 1)
			installed();
	}

	useIonViewWillEnter(async () => {
		setLoading(true);

		const system = await Requests.getSystem(match.params.system);

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
						<img src={game.cover} />
						<IonCardHeader className="header">
							<IonCardSubtitle>{game.name}</IonCardSubtitle>
						</IonCardHeader>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
