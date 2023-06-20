import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { add, playOutline, informationCircleOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { useToast } from '../hooks/toast';
import { CoreModal } from '../modals/core-modal';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import Audio from '../services/audio';
import Requests from '../services/requests';
import Files from '../services/files';
import Database from '../services/database';
import Path from '../services/path';

/**
 * @returns {JSX.Element}
 */
export const HomePage = () => {
	const fileInput = useRef(/** @type {HTMLInputElement} */ (null));

	const [systems, setSystems] = useState(/** @type {System[]} */ ([]));
	const [system,  setSystem]  = useState(/** @type {System}   */ (null));
	const [games,   setGames]   = useState(/** @type {Game[]}   */ ([]));
	const [game,    setGame]    = useState(/** @type {Game}     */ (null));

	const version = window.junie_build.split('-')[0];
	const build = window.junie_build.split('-')[1];
	const date = new Date(build * 1000).toUTCString();
	const [present] = useToast(`Junie - ${version} (${build})`);

	/**
	 * @param {FileList} input
	 * @returns {Promise<void>}
	 */
	const addGame = async (input) => {
		if (!input?.length)
			return;

		const file = input[0];

		const system = systems.find(x => x.extension == file.name.split('.').pop());
		if (!system)
			return;

		const path = Path.game(system.name, file.name);
		await Database.add(new File([file], path));

		setGames(await Files.Games.get());
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const deleteGame = async (game) => {
		await Files.Games.remove(game.system, game.rom);
		setGames(await Files.Games.get());
	}

	/**
	 * @param {Game} system
	 * @returns {void}
	 */
	const showModal = (game) => {
		const system = systems.find(system => system.name == game.system);

		setSystem(system);
		setGame(game);

		open({ cssClass: 'fullscreen' });
	}

	const [open, close] = useIonModal(CoreModal, { system, game, close: () => close() });

	useIonViewWillEnter(async () => {
		Audio.unlock();
		setSystems(await Requests.getSystems());
		setGames(await Files.Games.get());
	});

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonButton onClick={() => present(date)}>
							<IonIcon slot="icon-only" icon={informationCircleOutline} />
						</IonButton>
					</IonButtons>
					<IonTitle>Junie</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => fileInput.current.click()}>
							<input type="file" ref={fileInput} onChange={e => addGame(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="home page">
				<IonList lines="none">
					{games.map(game =>
						<IonCard key={game.rom}>
							<IonItemSliding>
								<IonItem color="light">
									<IonLabel>
										<h2>{game.name}</h2>
										<h3>{game.system}</h3>
									</IonLabel>
									<IonButton onClick={() => showModal(game)} fill="clear">
										<IonIcon slot="icon-only" icon={playOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteGame(game)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					)}
				</IonList>
			</IonContent>

		</IonPage>
	);
};
