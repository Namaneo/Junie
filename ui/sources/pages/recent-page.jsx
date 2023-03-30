import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useRef, useState } from 'react';
import { add, playOutline } from 'ionicons/icons';
import { Game } from '../entities/game';
import { JunImg } from '../components/jun-img';
import Audio from '../services/audio';
import Requests from '../services/requests';
import Files from '../services/files';

export const RecentPage = () => {

	const [played, setPlayed] = useState([])

	const addGame = async (files) => {
		if (!files?.length)
			return;

		const file = files[0];
		const systems = await Requests.getSystems();
		const system = systems.find(x => x.extension == file.name.split('.').pop());;

		const data = await file.arrayBuffer();
		const game = new Game(system, {
			name: file.name.substring(0, file.name.lastIndexOf('.')),
			rom: file.name
		});

		await Files.Games.add(game, data);

		setPlayed(await Files.Games.get());
	}

	const deleteGame = async (game) => {
		await Files.Games.remove(game);

		setPlayed(await Files.Games.get());
	}

	const gameURL = (played) => {
		return '/recent'
			+ `/${played.system.lib_name}`
			+ `/${played.system.name}`
			+ `/${played.game.rom}`;
	};

	useIonViewWillEnter(async () => {
		Audio.unlock();
		setPlayed(await Files.Games.get());
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
				<IonList lines="none">
					{played.map(played =>
						<IonCard key={played.game.rom}>
							<IonItemSliding>
								<IonItem color="light">
									<JunImg system={played.system} game={played.game} />
									<IonLabel>
										<h2>{played.game.name.replaceAll(/ \(.*\).*/g, '')}</h2>
										<h3>{played.system.name}</h3>
									</IonLabel>
									<IonButton routerLink={gameURL(played)} fill="clear">
										<IonIcon slot="icon-only" icon={playOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteGame(played)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					)}
				</IonList>

			</IonContent>

		</IonPage>
	);
};
