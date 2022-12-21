import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";

export const EditCheatModal = ({ current, systems, dismiss, apply }) => {

	const [system, setSystem] = useState(undefined);
	const [game, setGame] = useState(undefined);

	const [name, setName] = useState(current?.name);
	const [enabled, setEnabed] = useState(current?.enabled);
	const [order, setOrder] = useState(current?.order);
	const [value, setValue] = useState(current?.value);

	const systemChanged = (system) => {
		setSystem(system);
		setGame(undefined);
	};

	const isValid = () => {
		return (current || (system && game)) && name?.length && value?.length;
	}

	const validate = () => {
		if (!current)
			current = {};

		current.name = name;
		current.enabled = enabled;
		current.order = order;
		current.value = value;

		apply(current, system, game);
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

			<IonContent class="modal">
				<IonList lines="full">

					{!current && <IonItem>
						<IonLabel>System</IonLabel>
						<IonSelect interface="action-sheet" value={system} onIonChange={e => systemChanged(e.detail.value)}>
							{systems.filter(system => system.games.length).map(system =>
								<IonSelectOption key={system.name} value={system}>{system.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>}

					{!current && <IonItem>
						<IonLabel>Game</IonLabel>
						<IonSelect interface="action-sheet" value={game} disabled={!system} onIonChange={e => setGame(e.detail.value)}>
							{system?.games.map(game =>
								<IonSelectOption key={game.name} value={game}>{game.name}</IonSelectOption>
							)}
						</IonSelect>
					</IonItem>}

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
						<IonTextarea value={value} onIonChange={e => setValue(e.detail.value ?? '')} autoGrow />
					</IonItem>

				</IonList>

				<IonButton expand="block" disabled={!isValid()} onClick={() => validate()}>
					Apply
				</IonButton>

			</IonContent>
		</>
	);
}
