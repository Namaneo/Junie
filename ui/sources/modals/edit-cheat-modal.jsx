import { IonButton, IonCheckbox, IonInput, IonItem, IonList, IonSelect, IonSelectOption, IonTextarea } from '@ionic/react';
import { useState } from 'react';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import { Cheat } from '../entities/cheat';

/**
 * @param {Object} parameters
 * @param {boolean} parameters.isOpen
 * @param {Cheat} parameters.current
 * @param {System[]} parameters.systems
 * @param {(current: Cheat, system: System, game: Game) => void} parameters.apply
 * @returns {JSX.Element}
 */
export const EditCheatModal = ({ current, systems, apply }) => {
	const [system, setSystem] = useState(/** @type {System} */ (null));
	const [game,   setGame]   = useState(/** @type {Game}   */ (null));

	const [name,    setName]   = useState(/** @type {string}  */ (current?.name));
	const [enabled, setEnabed] = useState(/** @type {Boolean} */ (current?.enabled));
	const [order,   setOrder]  = useState(/** @type {number}  */ (current?.order));
	const [value,   setValue]  = useState(/** @type {string}  */ (current?.value));

	/**
	 * @param {System} system
	 * @returns {void}
	 */
	const systemChanged = (system) => {
		setSystem(system);
		setGame(null);
	};

	/**
	 * @returns {boolean}
	 */
	const isValid = () => {
		return (current || (system && game)) && name?.length && value?.length;
	}

	/**
	 * @return {void}
	 */
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
		<IonList lines="none">
			{!current && <IonItem>
				<IonSelect label="System" interface="action-sheet" value={system} onIonChange={e => systemChanged(e.detail.value)}>
					{systems.filter(system => system.games.length).map(system =>
						<IonSelectOption key={system.name} value={system}>{system.name}</IonSelectOption>
					)}
				</IonSelect>
			</IonItem>}

			{!current && <IonItem>
				<IonSelect label="Game" interface="action-sheet" value={game} disabled={!system} onIonChange={e => setGame(e.detail.value)}>
					{system?.games.map(game =>
						<IonSelectOption key={game.name} value={game}>{game.name}</IonSelectOption>
					)}
				</IonSelect>
			</IonItem>}

			<IonItem>
				<IonCheckbox checked={enabled} onIonChange={e => setEnabed(e.detail.checked)}>Enabled</IonCheckbox>
			</IonItem>

			<IonItem>
				<IonInput label="Name" value={name} onIonInput={e => setName(e.detail.value ?? '')} />
			</IonItem>

			<IonItem>
				<IonInput label="Order" type="number" value={order} min="0" onIonChange={e => setOrder(Number(e.detail.value ?? 0))} />
			</IonItem>

			<IonItem>
				<IonTextarea label="Value" value={value} onIonInput={e => setValue(e.detail.value ?? '')} autoGrow />
			</IonItem>

			<IonItem>
				<IonButton expand="block" disabled={!isValid()} onClick={validate}>
					Apply
				</IonButton>
			</IonItem>
		</IonList>
	);
}
