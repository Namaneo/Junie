import { IonBackButton, IonButton, IonButtons, IonCard, IonContent, IonHeader, IonItem, IonLabel, IonPage, IonProgressBar, IonTitle, IonToolbar, useIonAlert, useIonViewWillEnter } from '@ionic/react';
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

		system.games = system.games.filter(x => x.rom != game.rom);

		dismiss();
		present(`${game.name} (${system.name})`);

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
				{system.games.filter(game => !game.installed).map(game =>
					<IonCard key={game.rom} onClick={() => !download.game && install(game)}>
						<IonItem color="light">
							<img src={Requests.getGameCover(system, game.rom)} onError={(e) => e.target.src = 'assets/placeholder.png'} crossOrigin="anonymous" />
							<IonLabel>
								<h2>{game.name}</h2>
								{download.game == game.name &&
									<IonProgressBar value={download.progress}></IonProgressBar>
								}
							</IonLabel>
						</IonItem>
					</IonCard>
				)}
			</IonContent>

		</IonPage>
	);
}
