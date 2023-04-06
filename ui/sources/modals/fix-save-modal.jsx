import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';

export const FixSaveModal = ({ systems, dismiss, apply }) => {

	const [system, setSystem] = useState(null);
	const [game, setGame] = useState(null);

	const systemChanged = (system) => {
		setSystem(system);
		setGame(null);
	};

	const gameChanged = (game) => {
		setGame(game);
	};

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Fix save file</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={dismiss}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="modal">
				<IonList lines="full">

					<IonItem>
						<IonSelect label="System" interface="action-sheet" onIonChange={e => systemChanged(e.detail.value)}>
							{systems.filter(system => system.games.length).map(system =>
								<IonSelectOption key={system.name} value={system}>{system.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonSelect label="Game" interface="action-sheet" value={game} disabled={!system} onIonChange={e => gameChanged(e.detail.value)}>
							{system?.games.map(game =>
								<IonSelectOption key={game.name} value={game}>{game.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

				</IonList>

				<IonButton expand="block" disabled={!system || !game} onClick={() => apply(system, game)}>
					Apply fix
				</IonButton>

			</IonContent>
		</>
	);
}
