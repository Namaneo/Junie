import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";
import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";
import './FixSaveModal.scss'

type DismissPredicate = () => void;
type ApplyPredicate = (system: System, game: Game) => void;

interface FixSaveProps {
	systems: System[];
	dismiss: DismissPredicate,
	apply: ApplyPredicate,
}

interface FixSaveState {
	system: System | null;
	game: Game | null;
}

export const FixSaveModal: React.FC<FixSaveProps> = ({ systems, dismiss, apply }) => {

	const [state, setState] = useState<FixSaveState>({
		system: null,
		game: null,
	});

	const systemChanged = (system: System) => {
		state.system = system;
		state.game = null;

		setState({ ...state });
	};

	const gameChanged = (game: Game) => {
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
							{state.system?.games.map(game =>
								<IonSelectOption value={game}>{game.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

				</IonList>

				<IonButton expand="block" disabled={!state.system || !state.game} onClick={() => apply(state.system!, state.game!)}>
					Apply fix
				</IonButton>

			</IonContent>
		</>
	);
}