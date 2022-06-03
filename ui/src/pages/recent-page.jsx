import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useRef, useState } from 'react';
import { add } from 'ionicons/icons';
import { Game } from '../entities/game';
import { JunImg } from '../components/jun-img';
import * as Requests from '../services/requests';
import * as Database from "../services/database";

export const RecentPage = () => {

	const [played, setPlayed] = useState([])

	const addGame = async (files) => {
		if (!files?.length)
			return;

		const file = files[0];
		const systems = await Requests.getSystems();
		const system = systems.find(x => x.extension == gameName.split('.').pop());;

		const data = await file.arrayBuffer();
		const game = new Game(system, { 
			name: file.name.substring(0, file.name.lastIndexOf('.')),
			rom: file.name 
		});

		await Database.addGame(game, data);

		setPlayed(await Database.getGames());
	}

	const deleteGame = async (game) => {
		await Database.removeGame(game);

		setPlayed(await Database.getGames());
	}

	const startGame = async (played) => {
		window.frameElement.style.display = 'none';

		await junie_start_game({
			system: played.system.name,
			rom: played.game.rom,
			settings: await Database.getSettings(),
		});

		window.frameElement.style.display = 'block';
	}

	useIonViewWillEnter(async () => {
		setPlayed(await Database.getGames());
	});

	const fileInput = useRef(null);

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Recent</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => fileInput.current.click()}>
							<input type="file" ref={fileInput} onChange={e => addGame(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="recent">
				<IonList>
					<IonItemGroup>
						{played.map(played =>
							<IonCard key={played.game.rom}>
								<IonItemSliding>
									<IonItem>
										<JunImg system={played.system} game={played.game} />
										<IonLabel>
											<h2>{played.game.name.replaceAll(/ \(.*\).*/g, '')}</h2>
											<h3>{played.system.name}</h3>
										</IonLabel>
										<IonButton onClick={() => startGame(played)}>Play</IonButton>
									</IonItem>
									<IonItemOptions side="end">
										<IonItemOption color="danger" onClick={() => deleteGame(played)}>Delete</IonItemOption>
									</IonItemOptions>
								</IonItemSliding>
							</IonCard>
						)}
					</IonItemGroup>
				</IonList>

			</IonContent>

		</IonPage>
	);
};
