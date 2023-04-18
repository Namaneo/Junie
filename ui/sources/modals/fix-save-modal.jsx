import { IonButton, IonItem, IonList, IonSelect, IonSelectOption } from '@ionic/react';
import { useState } from 'react';
import { System } from '../entities/system';
import { Game } from '../entities/game';

/**
 * @param {Object} parameters
 * @param {System[]} parameters.systems
 * @param {(system: System, game: Game) => void} parameters.apply
 * @returns {JSX.Element}
 */
export const FixSaveModal = ({ systems, apply }) => {
	const [system, setSystem] = useState(/** @type {System} */ (null));
	const [game,   setGame]   = useState(/** @type {Game}   */ (null));

	/**
	 * @param {System} system
	 * @returns {void}
	 */
	const systemChanged = (system) => {
		setSystem(system);
		setGame(null);
	};

	/**
	 * @param {Game} game
	 * @returns {void}
	 */
	const gameChanged = (game) => {
		setGame(game);
	};

	/**
	 * @return {void}
	 */
	const validate = () => {
		apply(system, game);
	}

	return (
		<IonList lines="none">
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

			<IonItem>
				<IonButton expand="block" disabled={!system || !game} onClick={validate}>
					Apply fix
				</IonButton>
			</IonItem>
		</IonList>
	);
}
