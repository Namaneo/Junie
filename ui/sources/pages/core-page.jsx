import { IonAccordion, IonAccordionGroup, IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { checkmarkOutline } from 'ionicons/icons';
import { Joystick } from 'react-joystick-component';
import { useWindowSize } from '../hooks/window';
import { useCore } from '../hooks/core';
import Core from '../services/core';

const Settings = ({ variables, settings, update }) => {
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

const Cheats = ({ cheats }) => {
	return cheats?.map(item =>
		<IonItem key={item.name}>
			<IonLabel>{item.name} ({item.order})</IonLabel>
			{item.enabled && <IonIcon icon={checkmarkOutline} color="primary"></IonIcon>}
		</IonItem>
	) ?? null;
}

const Control = ({ core, name, device, id, className, inset }) => {
	const down = (e) => { core.send(device, id, 1); e.preventDefault(); };
	const up = (e) => { core.send(device, id, 0); e.preventDefault(); };

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

const Stick = ({ core, inset }) => {
	const size = Math.min(document.body.clientWidth * 0.32, 32 * 10);

	const style = {
		top:    `min(${inset.top}vw,    ${inset.top    * 10}px)`,
		right:  `min(${inset.right}vw,  ${inset.right  * 10}px)`,
		bottom: `min(${inset.bottom}vw, ${inset.bottom * 10}px)`,
		left:   `min(${inset.left}vw,   ${inset.left   * 10}px)`,
	};

	const event = (e) => {
		const valid = e.type = 'move' && e.distance > 50;

		core.send(Core.Device.JOYPAD, Core.Joypad.UP,    valid && e.direction == 'FORWARD');
		core.send(Core.Device.JOYPAD, Core.Joypad.DOWN,  valid && e.direction == 'BACKWARD');
		core.send(Core.Device.JOYPAD, Core.Joypad.LEFT,  valid && e.direction == 'LEFT');
		core.send(Core.Device.JOYPAD, Core.Joypad.RIGHT, valid && e.direction == 'RIGHT');
	}

	return (
		<div className="joystick" style={style}>
			<Joystick size={size} throttle={100} move={event} stop={event}
			          baseColor="transparent" stickColor="white" />
		</div>
	);
}

export const CorePage = ({ match }) => {
	const { lib, system, rom } = match.params;

	const [core, audio, speed, gamepad, joystick] = useCore(lib);
	const [pointer, setPointer] = useState({ x: 0, y: 0, down: false });
	const [width, height] = useWindowSize();

	const content = useRef(null);
	const canvas = useRef(null);

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

	const touch = (e, x, y, down) => {
		if (gamepad.value)
			return;

		setPointer({ x, y, down });
		e.preventDefault();
	}

	useEffect(() => {
		core.init(system, rom, canvas.current).then(() => resize());

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

	useEffect(() => resize(), [width, height]);

	return (
		<>
			<IonMenu className="core-settings" contentId="core" side="end" swipeGesture={false}>
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
									<Settings variables={core.variables} settings={core.settings} update={core.update}></Settings>
								</IonList>
							</IonAccordion>
							<IonAccordion>
								<IonItem slot="header">
									<IonLabel>Cheats</IonLabel>
								</IonItem>
								<IonList slot="content">
									<Cheats cheats={core.cheats}></Cheats>
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
							<IonBackButton />
						</IonButtons>
						<IonTitle>{system}</IonTitle>
						<IonButtons slot="end">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent className="core" ref={content}>
					<canvas ref={canvas}
						onTouchStart={(e) =>  touch(e, e.touches[0].clientX, e.touches[0].clientY, true)}
						onTouchMove={(e) =>   touch(e, e.touches[0].clientX, e.touches[0].clientY, pointer.down)}
						onTouchEnd={(e) =>    touch(e, pointer.x, pointer.y, false)}
						onTouchCancel={(e) => touch(e, pointer.x, pointer.y, false)}
						onMouseDown={(e) =>   touch(e, e.clientX, e.clientY, true)}
						onMouseMove={(e) =>   touch(e, e.clientX, e.clientY, pointer.down)}
						onMouseUp={(e) =>     touch(e, pointer.x, pointer.y, false)}
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
								<Stick core={core.current} inset={{bottom: 6, left: 2 }} />
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
