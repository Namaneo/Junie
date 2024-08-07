import { IonAccordion, IonAccordionGroup, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonAlert } from '@ionic/react';
import { useEffect, useRef } from 'react';
import { checkmarkOutline } from 'ionicons/icons';
import { useSize } from '../hooks/size';
import { useCore } from '../hooks/core';
import { InputButton, InputTouch } from '../entities/input';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import { Variable } from '../entities/variable';
import { Settings } from '../entities/settings';
import { Cheat } from '../entities/cheat';
import Input from '../services/input';

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
 * @param {string} parameters.name
 * @param {number} parameters.id
 * @param {('generic' | 'arrow' | 'shoulder' | 'special')} parameters.type
 * @param {{top: number, right: number, bottom: number, left: number}} parameters.inset
 * @returns {JSX.Element}
 */
const Control = ({ name, id, type, inset }) => {
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

	return <button style={style} data-id={id}>{name}</button>;
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
	const [window_w, window_h] = useSize({ current: document.body });
	const [canvas_w, canvas_h] = useSize(canvas);

	const [alert] = useIonAlert();

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

	/** @param {Event} event @returns {void} */
	const touch = (event) => {
		const touches =
			event.type.startsWith('mouse') ? [new InputTouch(event.type, event)] :
			event.type.startsWith('touch') ? [...event.changedTouches].map(touch => new InputTouch(event.type, touch)):
			[];

		const buttons = [...event.target.children].map(button => new InputButton(button));
		const rect = canvas.current.getBoundingClientRect();
		const width = canvas.current.width;
		const height = canvas.current.height;

		gamepad.value
			? core.current.press(touches, buttons)
			: core.current.touch(touches[0], rect, width, height);
	}

	/** @returns {void} */
	const save = () => alert('Current state will be saved.', [
		{ text: 'Confirm', handler: () => core.current.save() },
		{ text: 'Cancel' },
	]);

	/** @returns {void} */
	const restore = () => alert('Saved state will be restored.', [
		{ text: 'Confirm', handler: () => core.current.restore() },
		{ text: 'Cancel' },
	]);

	useEffect(() => {
		(async () => {
			try {
				await core.init(system.name, game.rom, canvas.current).then(() => resize());
			} catch (e) {
				console.error(e);
				alert({ header: e.stack.split('\n')[0], message: e.stack.split('\n')[1], buttons: [ 'OK' ] })
				core.current?.stop(); close();
			}
		})()

		return () => core.current.stop();
	}, []);

	useEffect(() => {
		content.current.addEventListener('touchstart',  (e) => e.preventDefault());
		content.current.addEventListener('touchmove',   (e) => e.preventDefault());
		content.current.addEventListener('touchend',    (e) => e.preventDefault());
		content.current.addEventListener('touchcancel', (e) => e.preventDefault());
	}, [content?.current]);

	useEffect(() => resize(), [core.current?.aspect_ratio, window_w, window_h, canvas_w, canvas_h]);

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

				<IonContent ref={content} className="core"
					onMouseDown={touch} onMouseMove={touch} onMouseUp={touch}
					onTouchStart={touch} onTouchMove={touch} onTouchEnd={touch} onTouchCancel={touch}>
					<canvas ref={canvas} />

					{gamepad.value && <div className="controls"><div>
						<Control name="A"        device={Input.Device.JOYPAD} id={Input.Joypad.A}     type='generic'  inset={{bottom: 30, right: 4 }} />
						<Control name="B"        device={Input.Device.JOYPAD} id={Input.Joypad.B}     type='generic'  inset={{bottom: 18, right: 16}} />
						<Control name="X"        device={Input.Device.JOYPAD} id={Input.Joypad.X}     type='generic'  inset={{bottom: 42, right: 16}} />
						<Control name="Y"        device={Input.Device.JOYPAD} id={Input.Joypad.Y}     type='generic'  inset={{bottom: 30, right: 28}} />
						<Control name="R"        device={Input.Device.JOYPAD} id={Input.Joypad.R}     type='shoulder' inset={{bottom: 48, right: 34}} />
						<Control name="&#x00B7;" device={Input.Device.JOYPAD} id={Input.Joypad.START} type='special'  inset={{bottom: 18, right: 37}} />

						<Control name="&#x140A;" device={Input.Device.JOYPAD} id={Input.Joypad.LEFT}   type='arrow'    inset={{bottom: 30, left: 4 }} />
						<Control name="&#x1401;" device={Input.Device.JOYPAD} id={Input.Joypad.DOWN}   type='arrow'    inset={{bottom: 18, left: 16}} />
						<Control name="&#x1403;" device={Input.Device.JOYPAD} id={Input.Joypad.UP}     type='arrow'    inset={{bottom: 42, left: 16}} />
						<Control name="&#x1405;" device={Input.Device.JOYPAD} id={Input.Joypad.RIGHT}  type='arrow'    inset={{bottom: 30, left: 28}} />
						<Control name="L"        device={Input.Device.JOYPAD} id={Input.Joypad.L}      type='shoulder' inset={{bottom: 48, left: 34}} />
						<Control name="&#x00B7;" device={Input.Device.JOYPAD} id={Input.Joypad.SELECT} type='special'  inset={{bottom: 18, left: 37}} />
					</div></div>}
				</IonContent>
			</IonPage>
		</>
	);
}
