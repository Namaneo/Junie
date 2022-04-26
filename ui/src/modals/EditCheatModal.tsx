import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";
import { Cheat } from "../entities/Cheat";
import { Game } from "../interfaces/Game";
import { System } from "../interfaces/System";
import styles from './EditCheatModal.module.scss'

type DismissPredicate = () => void;
type ApplyPredicate = (cheat: Cheat) => void;

interface EditCheatProps {
	current: Cheat;
	systems: System[];
	dismiss: DismissPredicate,
	apply: ApplyPredicate,
}

export const EditCheatModal: React.FC<EditCheatProps> = ({ current, systems, dismiss, apply }) => {

	const systemEntry = systems.find(x => x.name == current.system);
	const gameEntry = systemEntry?.games.find(x => x.rom == current.game);

	const [system, setSystem] = useState<System | undefined>(systemEntry);
	const [game, setGame] = useState<Game | undefined>(gameEntry);
	const [name, setName] = useState<string | undefined>(current.name);
	const [enabled, setEnabed] = useState<boolean | undefined>(current.enabled);
	const [order, setOrder] = useState<number | undefined>(current.order);
	const [value, setValue] = useState<string | undefined>(current.value);

	const systemChanged = (system: System) => {
		setSystem(system);
		setGame(undefined);
	};

	const isValid = () => {
		return !system || !game || !name?.length || !value?.length;
	}

	const validate = () => {
		if (!system || !game)
			return;
		
		current.system = system.name;
		current.game = game.rom;
		current.name = name;
		current.enabled = enabled;
		current.order = order;
		current.value = value;

		apply(current);
	}

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Edit cheat code</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={dismiss}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<IonList className={styles.list}>

					<IonItem>
						<IonLabel>System</IonLabel>
						<IonSelect interface="action-sheet" value={system} onIonChange={e => systemChanged(e.detail.value)}>
							{systems.map(system =>
								<IonSelectOption value={system}>{system.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Game</IonLabel>
						<IonSelect interface="action-sheet" value={game} disabled={!system?.games} onIonChange={e => setGame(e.detail.value)}>
							{system?.games?.map(game =>
								<IonSelectOption value={game}>{game.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Enabled</IonLabel>
						<IonCheckbox checked={enabled} onIonChange={e => setEnabed(e.detail.checked)} />
					</IonItem>

					<IonItem>
						<IonLabel>Name</IonLabel>
						<IonInput value={name} onIonChange={e => setName(e.detail.value ?? '')} />
					</IonItem>

					<IonItem>
						<IonLabel>Order</IonLabel>
						<IonInput type="number" value={order} min="0" onIonChange={e => setOrder(Number(e.detail.value ?? 0))} />
					</IonItem>

					<IonItem>
						<IonLabel>Value</IonLabel>
						<IonTextarea value={value} onIonChange={e => setValue(e.detail.value ?? '')} />
					</IonItem>

				</IonList>

				<IonButton expand="block" disabled={isValid()} onClick={() => validate()}>
					Apply
				</IonButton>

			</IonContent>
		</>
	);
}
