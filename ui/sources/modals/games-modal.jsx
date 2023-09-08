import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonPage, IonProgressBar, IonTitle, IonToolbar, useIonAlert, useIonModal } from '@ionic/react';
import { add, closeOutline, cloudDownloadOutline, playOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
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
			{status.game == game.rom &&
				<IonProgressBar value={status.progress}></IonProgressBar>
			}
			{status.game != game.rom && !game.installed &&
				<IonButton onClick={() => download(game)} disabled={!!status.game} fill="clear">
					<IonIcon slot="icon-only" icon={cloudDownloadOutline} />
				</IonButton>
			}
			{status.game != game.rom && game.installed && game.rom != '2048' &&
				<IonButton onClick={() => remove(game)} disabled={!!status.game} fill="clear">
					<IonIcon slot="icon-only" icon={trashOutline} color="medium" />
				</IonButton>
			}
			{status.game != game.rom && game.installed &&
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

	const sort = (games) => [...games.sort((g1, g2) => g1.rom < g2.rom ? -1 : 1)];

	const [game,   setGame]   = useState(null);
	const [games,  setGames]  = useState(sort(system.games));
	const [status, setStatus] = useState({ game: null, progress: 0 });

	const [start, stop] = useIonModal(CoreModal, { system, game, close: () => stop() });
	const [alert] = useIonAlert();

	/**
	 * @returns {Promise<void>}
	 */
	const update = async () => {
		const systems = await Requests.getSystems();
		const games = systems.find(sys => sys.name == system.name).games;
		setGames(sort(games));
	}

	/**
	 * @param {Game[]} games
	 * @param {string} rom
	 * @param {ReadableStream<Uint8Array>} stream
	 * @param {number} length
	 * @returns {Promise<void>}
	 */
	const read = async (games, rom, stream, length) => {
		setStatus({ game: rom, progress: 0 });

		const data = await Requests.readStream(stream, length, progress => {
			setStatus({ game: rom, progress });
		});

		if (!data) {
			alert({ header: 'Install failed', message: rom, buttons: [ 'OK' ] });
			return;
		}

		await Files.Games.add(system.name, rom, data);

		games.find(game => game.rom == rom).installed = true;
		setGames([...games]);
	}

	/**
	 * @param {FileList} files
	 * @returns {Promise<void>}
	 */
	const install = async (files) => {
		if (!files?.length)
			return;

		const pending = [...files].map(file => new Game(system, file.name, false));
		const available = games.filter(g1 => !pending.find(g2 => g1.rom == g2.rom));
		const updated = [...pending, ...available];
		setGames(updated);

		for (const file of files)
			await read(updated, file.name, file.stream(), file.size);

		input.current.value = null;
		setStatus({ game: null, progress: 0 });
		await update();
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const download = async (game) => {
		setStatus({ game: game.rom, progress: 0 });

		const response = await fetch(`${location.origin}/games/${system.name}/${game.rom}`);
		await read(games, game.rom, response.body, response.headers.get('Content-Length'));

		setStatus({ game: null, progress: 0 });
		await update();
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const remove = async (game) => {
		const handler = async () => {
			await Files.Games.remove(game.system, game.rom);
			await list.current.closeSlidingItems();
			await update();
		};

		alert({
			header: 'Delete this game?',
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
		start();
	}

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonTitle>{system.name}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => input.current.click()}>
							<input type="file" ref={input} onChange={e => install(e.target.files)} multiple hidden />
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
							<IonItem color="transparent">
								<IonLabel className="empty">You haven't installed any game yet.</IonLabel>
							</IonItem>
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
							<IonItem color="transparent">
								<IonLabel className="empty">No game is available to download.</IonLabel>
							</IonItem>
						}

					</IonItemGroup>
				</IonList>
			</IonContent>

		</IonPage>
	);
}
