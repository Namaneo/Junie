import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonAlert } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { checkmarkOutline } from 'ionicons/icons';
import { useSize } from '../hooks/size';
import { useCore } from '../hooks/core';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import { Variable } from '../entities/variable';
import { Settings } from '../entities/settings';
import { Cheat } from '../entities/cheat';
import Core from '../services/core';

/**
 * @param {Object} parameters
 * @param {Variable[]} parameters.variables
 * @param {Settings} parameters.settings
 * @param {(key: string, value: string) => void} parameters.update
 * @returns {JSX.Element}
 */
const SettingsView = ({ variables, settings, update }) => {
	if (!variables?.length)
		return null;

	return (
		<IonAccordion>
			<IonItem slot="header" lines="none">
				<IonLabel>Settings</IonLabel>
			</IonItem>
			<IonList slot="content" lines="none">
				{variables.map(item =>
					<IonItem key={item.key}>
						<IonSelect label={item.name} interface="action-sheet" labelPlacement="floating"
								value={settings?.[item.key] ?? item.options[0]}
								onIonChange={e => update(item.key, e.detail.value)}>
							{item.options.map(option => (
								<IonSelectOption key={option} value={option}>{option}</IonSelectOption>)
							)}
						</IonSelect>
					</IonItem>
				)}
			</IonList>
		</IonAccordion>
	);
}

/**
 * @param {Object} parameters
 * @param {Cheat[]} parameters.cheats
 * @returns {JSX.Element}
 */
const CheatsView = ({ cheats }) => {
	if (!cheats?.length)
		return null;

	return (
		<IonAccordion>
			<IonItem slot="header" lines="none">
				<IonLabel>Cheats</IonLabel>
			</IonItem>
			<IonList slot="content" lines="none">
				{cheats.map(item =>
					<IonItem key={item.name}>
						<IonLabel>{item.name} ({item.order})</IonLabel>
						{item.enabled && <IonIcon icon={checkmarkOutline} color="primary"></IonIcon>}
					</IonItem>
				)}
			</IonList>
		</IonAccordion>
	);
}

/**
 * @param {Object} parameters
 * @param {Core} parameters.core
 * @param {string} parameters.name
 * @param {number} parameters.device
 * @param {number} parameters.id
 * @param {('generic' | 'arrow' | 'shoulder' | 'special')} parameters.type
 * @param {{top: number, right: number, bottom: number, left: number}} parameters.inset
 * @returns {JSX.Element}
 */
const Control = ({ core, name, device, id, type, inset }) => {
	/** @param {Event} event @returns {void} */
	const down = (event) => { core.send(device, id, 1); event.preventDefault(); event.stopPropagation(); };

	/** @param {Event} event @returns {void} */
	const up = (event) => { core.send(device, id, 0); event.preventDefault(); event.stopPropagation(); };

	const unit = window.innerWidth < window.innerHeight ? 'vw' : 'vh'

	const style = {
		top:      `min(${inset.top}${unit},    ${inset.top    * 10}px)`,
		right:    `min(${inset.right}${unit},  ${inset.right  * 10}px)`,
		bottom:   `min(${inset.bottom}${unit}, ${inset.bottom * 10}px)`,
		left:     `min(${inset.left}${unit},   ${inset.left   * 10}px)`,
		fontSize: `min(5${unit}, 5 * 10px)`,
	};

	switch (type) {
		case 'generic':
			style.width = `min(12${unit}, 12 * 10px)`;
			style.height = `min(12${unit}, 12 * 10px)`;
			style.borderRadius = '50%';
			break;
		case 'arrow':
			style.width = `min(12${unit}, 12 * 10px)`;
			style.height = `min(12${unit}, 12 * 10px)`;
			style.borderRadius = '10%';
			break;
		case 'shoulder':
			style.width = `min(12${unit}, 12 * 10px)`;
			style.height = `min(8${unit}, 8 * 10px)`;
			style.borderRadius = '20%';
			break;
		case 'special':
			style.width = `min(8${unit}, 8 * 10px)`;
			style.height = `min(8${unit}, 8 * 10px)`;
			style.borderRadius = '50%';
			break;
	}

	return (
		<button style={style}
			onTouchStart={down} onTouchEnd={up} onTouchCancel={up}
			onMouseDown={down} onMouseUp={up}>
			{name}
		</button>
	);
}

/**
 * @param {Object} parameters
 * @param {System} parameters.system
 * @param {Game} parameters.game
 * @param {() => void} parameters.close
 * @returns {JSX.Element}
 */
export const CoreModal = ({ system, game, close }) => {
	const content = useRef(/** @type {HTMLIonContentElement} */ (null));
	const canvas  = useRef(/** @type {HTMLCanvasElement}     */ (null));

	const [core, audio, speed, gamepad] = useCore(system.lib_name);
	const [pointer, setPointer] = useState({ x: 0, y: 0, down: false });
	const [window_w, window_h] = useSize({ current: document.body });
	const [canvas_w, canvas_h] = useSize(canvas);

	const [confirm] = useIonAlert();

	/** @returns {void} */
	const resize = () => {
		const rect = content.current.getBoundingClientRect();

		const window_ratio = (rect.right - rect.left) / (rect.bottom - rect.top);
		const canvas_ratio = canvas.current.width / canvas.current.height;

		if (window_ratio < canvas_ratio) {
			canvas.current.style.width  = '100%';
			canvas.current.style.height = null;

		} else {
			canvas.current.style.width  = null;
			canvas.current.style.height = '100%';
		}
	};

	/**
	 * @param {Event} event
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} down
	 * @returns {void}
	 */
	const touch = (event, x, y, down) => {
		if (gamepad.value)
			return;

		setPointer({ x, y, down });
		event.preventDefault();
	}

	/** @returns {void} */
	const save = () => confirm('Current state will be saved.', [
		{ text: 'Confirm', handler: () => core.current.save() },
		{ text: 'Cancel' },
	]);

	/** @returns {void} */
	const restore = () => confirm('Saved state will be restored.', [
		{ text: 'Confirm', handler: () => core.current.restore() },
		{ text: 'Cancel' },
	]);

	useEffect(() => {
		core.init(system.name, game.rom, canvas.current).then(() => resize());

		return () => core.current.stop();
	}, []);

	useEffect(() => {
		const rect = canvas.current.getBoundingClientRect();

		const x = (pointer.x - rect.left) / (rect.right  - rect.left) * canvas.current.width;
		const y = (pointer.y - rect.top ) / (rect.bottom - rect.top ) * canvas.current.height;

		core.current.send(Core.Device.POINTER, Core.Pointer.X,       x);
		core.current.send(Core.Device.POINTER, Core.Pointer.Y,       y);
		core.current.send(Core.Device.POINTER, Core.Pointer.PRESSED, pointer.down);
		core.current.send(Core.Device.POINTER, Core.Pointer.COUNT,   1);
	}, [pointer]);

	useEffect(() => resize(), [window_w, window_h, canvas_w, canvas_h]);

	/** @param {Event} event @returns {void} */
	const dispatch = (event) => [...event.target.children].reduce((value, current) => {
		if (!value) return current;

		const prev_rect = value.getBoundingClientRect();
		const prev_center_x = prev_rect.left + prev_rect.width  / 2;
		const prev_center_y = prev_rect.top  + prev_rect.height / 2;
		const prev_dist_x = Math.max(Math.abs(event.clientX - prev_center_x) - prev_rect.width  / 2, 0);
		const prev_dist_y = Math.max(Math.abs(event.clientY - prev_center_y) - prev_rect.height / 2, 0);
		const prev_dist = Math.pow(prev_dist_x, 2) + Math.pow(prev_dist_y, 2);

		const curr_rect = current.getBoundingClientRect();
		const curr_center_x = curr_rect.left + curr_rect.width  / 2;
		const curr_center_y = curr_rect.top  + curr_rect.height / 2;
		const curr_dist_x = Math.max(Math.abs(event.clientX - curr_center_x) - curr_rect.width  / 2, 0);
		const curr_dist_y = Math.max(Math.abs(event.clientY - curr_center_y) - curr_rect.height / 2, 0);
		const curr_dist = Math.pow(curr_dist_x, 2) + Math.pow(curr_dist_y, 2);

		return curr_dist < prev_dist ? current : value;
	}).dispatchEvent(new event.nativeEvent.constructor(event.type, { bubbles: true }));

	return (
		<>
			<IonMenu className="core-settings" contentId="core" side="start" swipeGesture={false}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Settings</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent>
					<IonList lines="none">
						<IonItem>
							<IonButton fill="outline" onClick={() => save()}>Save state</IonButton>
							<IonButton fill="outline" onClick={() => restore()}>Restore state</IonButton>
						</IonItem>
						<IonSegment value={speed.value} onIonChange={e => speed.set(e.detail.value)}>
							<IonSegmentButton value={1}><IonLabel>1x</IonLabel></IonSegmentButton>
							<IonSegmentButton value={2}><IonLabel>2x</IonLabel></IonSegmentButton>
							<IonSegmentButton value={4}><IonLabel>4x</IonLabel></IonSegmentButton>
						</IonSegment>
						<IonItem>
							<IonCheckbox checked={audio.value} onIonChange={e => audio.set(e.detail.checked)}>Enable audio</IonCheckbox>
						</IonItem>
						<IonItem>
							<IonCheckbox checked={gamepad.value} onIonChange={e => gamepad.set(e.detail.checked)}>Show gamepad</IonCheckbox>
						</IonItem>
						<IonAccordionGroup>
							<SettingsView variables={core.variables} settings={core.settings} update={core.update}></SettingsView>
							<CheatsView cheats={core.cheats}></CheatsView>
						</IonAccordionGroup>
					</IonList>
				</IonContent>
			</IonMenu>

			<IonPage id="core">
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
						<IonTitle>{system.name}</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={close}>Close</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent ref={content} className="core">
					<canvas ref={canvas}
						onTouchStart={ (event) => touch(event, event.touches[0].clientX, event.touches[0].clientY, true)        }
						onTouchMove={  (event) => touch(event, event.touches[0].clientX, event.touches[0].clientY, pointer.down)}
						onTouchEnd={   (event) => touch(event, pointer.x,                pointer.y,                false)       }
						onTouchCancel={(event) => touch(event, pointer.x,                pointer.y,                false)       }
						onMouseDown={  (event) => touch(event, event.clientX,            event.clientY,            true)        }
						onMouseMove={  (event) => touch(event, event.clientX,            event.clientY,            pointer.down)}
						onMouseUp={    (event) => touch(event, pointer.x,                pointer.y,                false)       }
					/>

					{gamepad.value && <div className="controls"><div onTouchStart={dispatch} onTouchEnd={dispatch} onTouchCancel={dispatch} onMouseDown={dispatch} onMouseUp={dispatch}>
						<Control core={core.current} name="A"        device={Core.Device.JOYPAD} id={Core.Joypad.A}     type='generic'  inset={{bottom: 30, right: 4 }} />
						<Control core={core.current} name="B"        device={Core.Device.JOYPAD} id={Core.Joypad.B}     type='generic'  inset={{bottom: 18, right: 16}} />
						<Control core={core.current} name="X"        device={Core.Device.JOYPAD} id={Core.Joypad.X}     type='generic'  inset={{bottom: 42, right: 16}} />
						<Control core={core.current} name="Y"        device={Core.Device.JOYPAD} id={Core.Joypad.Y}     type='generic'  inset={{bottom: 30, right: 28}} />
						<Control core={core.current} name="R"        device={Core.Device.JOYPAD} id={Core.Joypad.R}     type='shoulder' inset={{bottom: 48, right: 34}} />
						<Control core={core.current} name="&#x00B7;" device={Core.Device.JOYPAD} id={Core.Joypad.START} type='special'  inset={{bottom: 18, right: 37}} />

						<Control core={core.current} name="&#x140A;" device={Core.Device.JOYPAD} id={Core.Joypad.LEFT}   type='arrow'    inset={{bottom: 30, left: 4 }} />
						<Control core={core.current} name="&#x1401;" device={Core.Device.JOYPAD} id={Core.Joypad.DOWN}   type='arrow'    inset={{bottom: 18, left: 16}} />
						<Control core={core.current} name="&#x1403;" device={Core.Device.JOYPAD} id={Core.Joypad.UP}     type='arrow'    inset={{bottom: 42, left: 16}} />
						<Control core={core.current} name="&#x1405;" device={Core.Device.JOYPAD} id={Core.Joypad.RIGHT}  type='arrow'    inset={{bottom: 30, left: 28}} />
						<Control core={core.current} name="L"        device={Core.Device.JOYPAD} id={Core.Joypad.L}      type='shoulder' inset={{bottom: 48, left: 34}} />
						<Control core={core.current} name="&#x00B7;" device={Core.Device.JOYPAD} id={Core.Joypad.SELECT} type='special'  inset={{bottom: 18, left: 37}} />
					</div></div>}
				</IonContent>
			</IonPage>
		</>
	);
}
