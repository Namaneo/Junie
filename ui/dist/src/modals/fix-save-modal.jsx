import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";

export const FixSaveModal = ({ systems, dismiss, apply }) => {

	const [state, setState] = useState({ system: null, game: null });

	const systemChanged = (system) => {
		state.system = system;
		state.game = null;

		setState({ ...state });
	};

	const gameChanged = (game) => {
		state.game = game;

		setState({ ...state });
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

			<IonContent>
				<IonList>

					<IonItem>
						<IonLabel>System</IonLabel>
						<IonSelect interface="action-sheet" onIonChange={e => systemChanged(e.detail.value)}>
							{systems.map(system =>
								<IonSelectOption value={system}>{system.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Game</IonLabel>
						<IonSelect interface="action-sheet" value={state.game} disabled={!state.system} onIonChange={e => gameChanged(e.detail.value)}>
							{state.system?.games?.map(game =>
								<IonSelectOption value={game}>{game.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

				</IonList>

				<IonButton expand="block" disabled={!state.system || !state.game} onClick={() => apply(state.system, state.game)}>
					Apply fix
				</IonButton>

			</IonContent>
		</>
	);
}
