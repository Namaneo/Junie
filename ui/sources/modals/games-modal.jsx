import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonPage, IonProgressBar, IonTitle, IonToolbar, useIonAlert } from '@ionic/react';
import { cloudDownloadOutline, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useToast } from '../hooks/toast';
import { Game } from '../entities/game';
import Requests from '../services/requests';
import Files from '../services/files';

/**
 * @param {Object} parameters
 * @param {string} parameters.system
 * @param {() => void} parameters.close
 * @returns {JSX.Element}
 */
export const GamesModal = ({ system, close }) => {
	const [download, setDownload] = useState({ game: null, progress: 0 });

	const [present, dismiss] = useToast('Game successfully installed!');
	const [alert] = useIonAlert();

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const install = async (game) => {
		setDownload({ game: game.name, progress: 0 });
		const data = await Requests.fetchGame(system, game, progress => {
			setDownload({ game: game.name, progress });
		});

		if (!data) {
			alert({
				header: 'Install failed',
				message: `${game.name} (${system.name})`,
				buttons: [ 'OK' ],
			});
			setDownload({ game: null, progress: 0 });
			return;
		}

		await Files.Games.add(system.name, game.rom, data);
		game.installed = true;

		dismiss();
		present(`${game.name} (${system.name})`);

		setDownload({ game: null, progress: 0 });
	}

	/**
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const remove = async (game) => {
		await Files.Games.remove(game.system, game.rom);
		game.installed = false;

		setDownload({ game: null, progress: 0 });
	}

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonTitle>Games</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={close}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="games">
				{system.games.map(game =>
					<IonCard key={game.rom}>
						<IonItem color="light">
							<IonLabel>
								<h2>{game.name}</h2>
								<h3>{game.system}</h3>
							</IonLabel>
							{download.game == game.name &&
								<IonProgressBar value={download.progress}></IonProgressBar>
							}
							{download.game != game.name && !game.installed &&
								<IonButton onClick={() => install(game)} disabled={!!download.game} fill="clear">
									<IonIcon slot="icon-only" icon={cloudDownloadOutline} />
								</IonButton>
							}
							{download.game != game.name && game.installed &&
								<IonButton onClick={() => remove(game)} disabled={!!download.game} fill="clear">
									<IonIcon slot="icon-only" icon={trashOutline} color="medium" />
								</IonButton>
							}
						</IonItem>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
