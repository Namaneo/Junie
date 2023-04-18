import { IonAccordion, IonAccordionGroup, IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useRouteMatch } from 'react-router';
import { checkmarkOutline } from 'ionicons/icons';
import { Joystick } from 'react-joystick-component';
import { useCanvasSize, useWindowSize } from '../hooks/size';
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
	return variables?.map(item =>
		<IonItem key={item.key}>
			<IonSelect label={item.name} interface="action-sheet"
			           value={settings?.[item.key] ?? item.options[0]}
			           onIonChange={e => update(item.key, e.detail.value)}>
				{item.options.map(option => (
					<IonSelectOption key={option} value={option}>{option}</IonSelectOption>)
				)}
			</IonSelect>
		</IonItem>
	) ?? null;
}

/**
 * @param {Object} parameters
 * @param {Cheat[]} parameters.cheats
 * @returns {JSX.Element}
 */
const CheatsView = ({ cheats }) => {
	return cheats?.map(item =>
		<IonItem key={item.name}>
			<IonLabel>{item.name} ({item.order})</IonLabel>
			{item.enabled && <IonIcon icon={checkmarkOutline} color="primary"></IonIcon>}
		</IonItem>
	) ?? null;
}

/**
 * @param {Object} parameters
 * @param {Core} parameters.core
 * @param {string} parameters.name
 * @param {number} parameters.device
 * @param {number} parameters.id
 * @param {string} parameters.className
 * @param {{top: number, right: number, bottom: number, left: number}} parameters.inset
 * @returns {JSX.Element}
 */
const Control = ({ core, name, device, id, className, inset }) => {
	/**
	 * @param {Event} event
	 * @returns {void}
	 */
	const down = (event) => {
		core.send(device, id, 1);
		event.preventDefault();
	};

	/**
	 * @param {Event} event
	 * @returns {void}
	 */
	const up = (event) => {
		core.send(device, id, 0);
		event.preventDefault();
	};

	const style = {
		top:    `min(${inset.top}vw,    ${inset.top    * 10}px)`,
		right:  `min(${inset.right}vw,  ${inset.right  * 10}px)`,
		bottom: `min(${inset.bottom}vw, ${inset.bottom * 10}px)`,
		left:   `min(${inset.left}vw,   ${inset.left   * 10}px)`,
	};

	return (
		<button className={className} style={style}
			onTouchStart={down} onTouchEnd={up} onTouchCancel={up}
			onMouseDown={down} onMouseUp={up}>
			{name}
		</button>
	);
}

/**
 * @param {Object} parameters
 * @param {Core} parameters.core
 * @param {number} parameters.width
 * @param {{top: number, right: number, bottom: number, left: number}} parameters.inset
 * @returns {JSX.Element}
 */
const Stick = ({ core, width, inset }) => {
	const size = Math.min(width * 0.32, 32 * 10);

	const style = {
		top:    `min(${inset.top}vw,    ${inset.top    * 10}px)`,
		right:  `min(${inset.right}vw,  ${inset.right  * 10}px)`,
		bottom: `min(${inset.bottom}vw, ${inset.bottom * 10}px)`,
		left:   `min(${inset.left}vw,   ${inset.left   * 10}px)`,
	};

	/**
	 * @param {Event} event
	 * @returns {void}
	 */
	const event = (event) => {
		const valid = event.type = 'move' && event.distance > 50;

		core.send(Core.Device.JOYPAD, Core.Joypad.UP,    valid && event.direction == 'FORWARD');
		core.send(Core.Device.JOYPAD, Core.Joypad.DOWN,  valid && event.direction == 'BACKWARD');
		core.send(Core.Device.JOYPAD, Core.Joypad.LEFT,  valid && event.direction == 'LEFT');
		core.send(Core.Device.JOYPAD, Core.Joypad.RIGHT, valid && event.direction == 'RIGHT');
	}

	return (
		<div className="joystick" style={style}>
			<Joystick size={size} throttle={100} move={event} stop={event}
			          baseColor="transparent" stickColor="white" />
		</div>
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

	const [core, audio, speed, gamepad, joystick] = useCore(system.lib_name);
	const [pointer, setPointer] = useState({ x: 0, y: 0, down: false });
	const [window_w, window_h] = useWindowSize();
	const [canvas_w, canvas_h] = useCanvasSize(canvas);

	/**
	 * @returns {void}
	 */
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

	return (
		<>
			<IonMenu className="core-settings" contentId="core" side="start" swipeGesture={false}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Settings</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent>
					<IonList>
						<IonItem>
							<IonButton fill="outline" onClick={() => core.current.save()}>Save state</IonButton>
							<IonButton fill="outline" onClick={() => core.current.restore()}>Restore state</IonButton>
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
						<IonItem>
							<IonCheckbox checked={joystick.value} onIonChange={e => joystick.set(e.detail.checked)}>Use joystick</IonCheckbox>
						</IonItem>
						<IonAccordionGroup>
							<IonAccordion>
								<IonItem slot="header">
									<IonLabel>Settings</IonLabel>
								</IonItem>
								<IonList slot="content">
									<SettingsView variables={core.variables} settings={core.settings} update={core.update}></SettingsView>
								</IonList>
							</IonAccordion>
							<IonAccordion>
								<IonItem slot="header">
									<IonLabel>Cheats</IonLabel>
								</IonItem>
								<IonList slot="content">
									<CheatsView cheats={core.cheats}></CheatsView>
								</IonList>
							</IonAccordion>
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

				<IonContent className="core" ref={content}>
					<canvas ref={canvas}
						onTouchStart={ (event) => touch(event, event.touches[0].clientX, event.touches[0].clientY, true)        }
						onTouchMove={  (event) => touch(event, event.touches[0].clientX, event.touches[0].clientY, pointer.down)}
						onTouchEnd={   (event) => touch(event, pointer.x,                pointer.y,                false)       }
						onTouchCancel={(event) => touch(event, pointer.x,                pointer.y,                false)       }
						onMouseDown={  (event) => touch(event, event.clientX,            event.clientY,            true)        }
						onMouseMove={  (event) => touch(event, event.clientX,            event.clientY,            pointer.down)}
						onMouseUp={    (event) => touch(event, pointer.x,                pointer.y,                false)       }
					/>

					{gamepad.value &&
						<>
							<Control core={core.current} name="A"      device={Core.Device.JOYPAD} id={Core.Joypad.A}     className='generic'  inset={{bottom: 16, right: 4 }} />
							<Control core={core.current} name="B"      device={Core.Device.JOYPAD} id={Core.Joypad.B}     className='generic'  inset={{bottom: 4,  right: 16}} />
							<Control core={core.current} name="X"      device={Core.Device.JOYPAD} id={Core.Joypad.X}     className='generic'  inset={{bottom: 28, right: 16}} />
							<Control core={core.current} name="Y"      device={Core.Device.JOYPAD} id={Core.Joypad.Y}     className='generic'  inset={{bottom: 16, right: 28}} />
							<Control core={core.current} name="R"      device={Core.Device.JOYPAD} id={Core.Joypad.R}     className='shoulder' inset={{bottom: 34, right: 34}} />
							<Control core={core.current} name="&#183;" device={Core.Device.JOYPAD} id={Core.Joypad.START} className='special'  inset={{bottom: 4,  right: 37}} />

							{joystick.value && <>
								<Stick core={core.current} width={window_w} inset={{bottom: 6, left: 2 }} />
							</>}
							{!joystick.value && <>
								<Control core={core.current} name="&#5130;" device={Core.Device.JOYPAD} id={Core.Joypad.LEFT}  className='arrow' inset={{bottom: 16, left: 4 }} />
								<Control core={core.current} name="&#5121;" device={Core.Device.JOYPAD} id={Core.Joypad.DOWN}  className='arrow' inset={{bottom: 4,  left: 16}} />
								<Control core={core.current} name="&#5123;" device={Core.Device.JOYPAD} id={Core.Joypad.UP}    className='arrow' inset={{bottom: 28, left: 16}} />
								<Control core={core.current} name="&#5125;" device={Core.Device.JOYPAD} id={Core.Joypad.RIGHT} className='arrow' inset={{bottom: 16, left: 28}} />
							</>}

							<Control core={core.current} name="L"      device={Core.Device.JOYPAD} id={Core.Joypad.L}      className='shoulder' inset={{bottom: 34, left: 34}} />
							<Control core={core.current} name="&#183;" device={Core.Device.JOYPAD} id={Core.Joypad.SELECT} className='special'  inset={{bottom: 4,  left: 37}} />
						</>
					}
				</IonContent>
			</IonPage>
		</>
	);
}
