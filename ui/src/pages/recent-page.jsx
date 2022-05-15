import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useRef, useState } from 'react';
import { add } from 'ionicons/icons';
import { Game } from '../entities/game';
import { JunImg } from '../components/jun-img';
import * as Requests from '../services/requests';
import * as Database from '../services/database';

export const RecentPage = () => {

	const [played, setPlayed] = useState([])

	const addGame = async (files) => {
		if (!files?.length)
			return;

		const system = await Requests.getSystemByGame(files[0].name);

		const data = await files[0].arrayBuffer();
		const game = new Game(data, system, { rom: files[0].name, });
		const games = await Database.updateGame(game);

		setPlayed(games);
	}

	const deleteGame = async (game) => {
		setPlayed(await Database.removeGame(game));
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

			<IonContent>
				<IonList style={{ padding: 0 }}>
					<IonItemGroup>
						{played.map(played =>
							<IonItemSliding key={played.game.rom}>
								<IonItem lines="full">
									<JunImg src={played.game.cover} style={{ maxWidth: '25%', margin: '4px 0' }} />
									<IonLabel style={{ marginLeft: '16px' }}>
										<h2>{played.game.name}</h2>
										<h3>{played.system.name}</h3>
									</IonLabel>
									<IonButton href={`app/#/${played.system.name}/${played.game.rom}`}>Play</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteGame(played)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						)}
					</IonItemGroup>
				</IonList>

			</IonContent>

		</IonPage>
	);
};
