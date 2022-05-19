import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useRef, useState } from 'react';
import { add } from 'ionicons/icons';
import { Game } from '../entities/game';
import { JunImg } from '../components/jun-img';
import * as Requests from '../services/requests';
import * as Database from '../services/database';

// TODO Should be generated from a settings page
const settings = {
	"language": "ENGLISH",
	"bindings": {
		"A": "X",
		"B": "Z",
		"X": "S",
		"Y": "A",
		"UP": "UP",
		"DOWN": "DOWN",
		"LEFT": "LEFT",
		"RIGHT": "RIGHT",
		"L": "C",
		"R": "D",
		"SELECT": "ENTER",
		"START": "SPACE"
	},
	"melonDS": {
		"melonds_touch_mode": "Touch",
		"melonds_randomize_mac_address": "enabled"
	}
};

export const RecentPage = () => {

	const [played, setPlayed] = useState([])

	const addGame = async (files) => {
		if (!files?.length)
			return;

		const system = await Requests.getSystemByGame(files[0].name);

		const data = await files[0].arrayBuffer();
		const game = new Game(system, { rom: files[0].name, });
		const games = await Database.addGame(game, data);

		setPlayed(games);
	}

	const deleteGame = async (game) => {
		setPlayed(await Database.removeGame(game));
	}

	const start_game = async (played) => {
		await junie_start_game({
			system: played.system.name,
			rom: played.game.rom,
			settings: settings,
		});

		window.frameElement.style.display = 'none';
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
										<JunImg src={played.game.cover} />
										<IonLabel>
											<h2>{played.game.name.replaceAll(/ \(.*\).*/g, '')}</h2>
											<h3>{played.system.name}</h3>
										</IonLabel>
										<IonButton onClick={() => start_game(played)}>Play</IonButton>
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