import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonPage, IonProgressBar, IonTitle, IonToolbar, useIonAlert, useIonModal } from '@ionic/react';
import { add, closeOutline, cloudDownloadOutline, playOutline, trashOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { useToast } from '../hooks/toast';
import { CoreModal } from './core-modal';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import Requests from '../services/requests';
import Files from '../services/files';
import Path from '../services/path';

/**
 * @param {Object} parameters
 * @param {Game} parameters.game
 * @param {{ game: string, progress: number }} parameters.status
 * @param {(game: Game) => Promise<void>} parameters.download
 * @param {(game: Game) => Promise<void>} parameters.play
 * @param {(game: Game) => Promise<void>} parameters.remove
 * @returns {JSX.Element}
 */
const GameCard = ({ game, status, download, play, remove }) => {
	return (
		<IonItem color="transparent">
			<IonLabel>{Path.clean(game.name)}</IonLabel>
			{status.game == game.name &&
				<IonProgressBar value={status.progress}></IonProgressBar>
			}
			{status.game != game.name && !game.installed &&
				<IonButton onClick={() => download(game)} disabled={!!status.game} fill="clear">
					<IonIcon slot="icon-only" icon={cloudDownloadOutline} />
				</IonButton>
			}
			{status.game != game.name && game.installed && game.name != '2048' &&
				<IonButton onClick={() => remove(game)} disabled={!!status.game} fill="clear">
					<IonIcon slot="icon-only" icon={trashOutline} color="medium" />
				</IonButton>
			}
			{status.game != game.name && game.installed &&
				<IonButton onClick={() => play(game)} disabled={!!status.game} fill="clear">
					<IonIcon slot="icon-only" icon={playOutline} />
				</IonButton>
			}
		</IonItem>
	);
}

/**
 * @param {Object} parameters
 * @param {System} parameters.system
 * @param {() => void} parameters.close
 * @returns {JSX.Element}
 */
export const GamesModal = ({ system, close }) => {
	const list  = useRef(/** @type {HTMLIonListElement} */ (null));
	const input = useRef(/** @type {HTMLInputElement} */ (null));

	const sort = () => [...system.games.sort((g1, g2) => g1.rom < g2.rom ? -1 : 1)];

	const [game,   setGame]   = useState(null);
	const [games,  setGames]  = useState(sort(system.games));
	const [status, setStatus] = useState({ game: null, progress: 0 });

	const [start, stop] = useIonModal(CoreModal, { system, game, close: () => stop() });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();

	/**
	 * @param {FileList} input
	 * @returns {Promise<void>}
	 */
	const install = async (input) => {
		if (!input?.length)
			return;

		const file = input[0];

		const buffer = new Uint8Array(await file.arrayBuffer())
		await Files.Games.add(system.name, file.name, buffer);

		const games = await Files.Games.get();
		system.games.push(games.find(game => game.rom == file.name));

		setGames(sort(system.games));
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const download = async (game) => {
		setStatus({ game: game.name, progress: 0 });
		const data = await Requests.fetchGame(system, game, progress => {
			setStatus({ game: game.name, progress });
		});

		if (!data) {
			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});
			setStatus({ game: null, progress: 0 });
			return;
		}

		await Files.Games.add(system.name, game.rom, data);
		game.installed = true;

		dismiss();
		present(`${game.name} (${system.name})`);

		setStatus({ game: null, progress: 0 });
		setGames(sort(system.games));
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const remove = async (game) => {
		const handler = async () => {
			await Files.Games.remove(game.system, game.rom);
			game.installed = false;

			await list.current.closeSlidingItems();
			setGames(sort(system.games));
		};

		alert({
			header: 'Delete that game?',
			message: game.name,
			buttons: [
				{ text: 'Confirm', handler },
				{ text: 'Cancel' },
			],
		});
	}

	/**
	 * @param {Game} game
	 * @returns {void}
	 */
	const play = (game) => {
		setGame(game);
		start({ cssClass: 'fullscreen' });
	}

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonTitle>{system.name}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => input.current.click()}>
							<input type="file" ref={input} onChange={e => install(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
						<IonButton onClick={close}>
							<IonIcon slot="icon-only" icon={closeOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="games">
				<IonList lines="none" ref={list}>
					<IonItemGroup>
						<IonItemDivider>
							<IonLabel>Installed</IonLabel>
						</IonItemDivider>

						{games.filter(game => game.installed).map(game => (
							<GameCard key={game.rom} game={game} status={status} download={download} play={play} remove={remove} />
						))}

						{!games.filter(game => game.installed).length &&
							<IonLabel className="empty">
								You haven't installed any game yet.
							</IonLabel>
						}

					</IonItemGroup>
					<IonItemGroup>
						<IonItemDivider>
							<IonLabel>Available</IonLabel>
						</IonItemDivider>

						{games.filter(game => !game.installed).map(game => (
							<GameCard key={game.rom} game={game} status={status} download={download} play={play} />
						))}

						{!games.filter(game => !game.installed).length &&
							<IonLabel className="empty">
								No game is available to download.<br />
								Try refreshing the library from the home page.
							</IonLabel>
						}

					</IonItemGroup>
				</IonList>
			</IonContent>

		</IonPage>
	);
}
