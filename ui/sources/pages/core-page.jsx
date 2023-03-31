import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from '../hooks/window';
import Core from '../services/core';
import Files from '../services/files';

const Control = ({ core, name, device, id, className, inset }) => {
	const down = (e) => { core.send(device, id, 1); e.preventDefault(); };
	const up = (e) => { core.send(device, id, 0); e.preventDefault(); };

	const style = {
		top:    `min(${inset.top}vw,    ${inset.top    * 10}px)`,
		right:  `min(${inset.right}vw,  ${inset.right  * 10}px)`,
		bottom: `min(${inset.bottom}vw, ${inset.bottom * 10}px)`,
		left:   `min(${inset.left}vw,   ${inset.left   * 10}px)`,
	}

	return (
		<button className={className} style={style}
			onTouchStart={down} onTouchEnd={up} onTouchCancel={up}
			onMouseDown={down} onMouseUp={up}>
			{name}
		</button>
	)
}

export const CorePage = ({ match }) => {

	const [core] = useState(Core.create(match.params.lib));
	const [audio, setAudio] = useState(true);
	const [gamepad, setGamepad] = useState(true);
	const [touch, setTouch] = useState({ x: 0, y: 0, down: false });
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

	useEffect(() => {
		const start = async () => {
			await core.init();
			await core.prepare(match.params.system, match.params.game);

			await core.start(await Files.Settings.get(), canvas.current);

			resize();
		}

		start();

		return () => core.stop();
	}, []);

	useEffect(() => {
		const rect = canvas.current.getBoundingClientRect();

		const x = (touch.x - rect.left) / (rect.right  - rect.left) * canvas.current.width;
		const y = (touch.y - rect.top ) / (rect.bottom - rect.top ) * canvas.current.height;

		core.send(Core.Device.POINTER, Core.Pointer.X,       x);
		core.send(Core.Device.POINTER, Core.Pointer.Y,       y);
		core.send(Core.Device.POINTER, Core.Pointer.PRESSED, touch.down);
		core.send(Core.Device.POINTER, Core.Pointer.COUNT,   1);
	}, [touch]);

	useEffect(() => resize(), [width, height]);

	useEffect(() => core.audio(audio), [audio]);

	return (
		<>
			<IonMenu contentId="core" side="end" swipeGesture={false}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Settings</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonContent class="core-settings">
					<IonList>
						<IonItem>
							<IonButton fill="outline" onClick={() => core.save()}>Save state</IonButton>
							<IonButton fill="outline" onClick={() => core.restore()}>Restore state</IonButton>
						</IonItem>
						<IonItem>
							<IonLabel>Enable audio</IonLabel>
							<IonCheckbox checked={audio} onIonChange={() => setAudio(!audio)}></IonCheckbox>
						</IonItem>
						<IonItem>
							<IonLabel>Show gamepad</IonLabel>
							<IonCheckbox checked={gamepad} onIonChange={() => setGamepad(!gamepad)}></IonCheckbox>
						</IonItem>
					</IonList>
				</IonContent>
			</IonMenu>

			<IonPage id="core">
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton />
						</IonButtons>
						<IonTitle>{match.params.system}</IonTitle>
						<IonButtons slot="end">
							<IonMenuButton></IonMenuButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent class="core" ref={content}>
					<canvas ref={canvas}
						onMouseDown={(e) => !gamepad && setTouch({ x: e.clientX, y: e.clientY, down: true })}
						onMouseUp={(e) =>   !gamepad && setTouch({ x: e.clientX, y: e.clientY, down: false })}
						onMouseMove={(e) => !gamepad && setTouch({ x: e.clientX, y: e.clientY, down: touch.down })}
					/>

					{gamepad &&
						<>
							<Control core={core} name="A"       device={Core.Device.JOYPAD} id={Core.Joypad.A}      className='generic'  inset={{bottom: 16, right: 4 }} />
							<Control core={core} name="B"       device={Core.Device.JOYPAD} id={Core.Joypad.B}      className='generic'  inset={{bottom: 4,  right: 16}} />
							<Control core={core} name="X"       device={Core.Device.JOYPAD} id={Core.Joypad.X}      className='generic'  inset={{bottom: 28, right: 16}} />
							<Control core={core} name="Y"       device={Core.Device.JOYPAD} id={Core.Joypad.Y}      className='generic'  inset={{bottom: 16, right: 28}} />
							<Control core={core} name="R"       device={Core.Device.JOYPAD} id={Core.Joypad.R}      className='shoulder' inset={{bottom: 34, right: 34}} />
							<Control core={core} name="&#183;"  device={Core.Device.JOYPAD} id={Core.Joypad.SELECT} className='special'  inset={{bottom: 4,  right: 37}} />

							<Control core={core} name="&#5130;" device={Core.Device.JOYPAD} id={Core.Joypad.LEFT}   className='arrow'    inset={{bottom: 16, left:  4 }} />
							<Control core={core} name="&#5121;" device={Core.Device.JOYPAD} id={Core.Joypad.DOWN}   className='arrow'    inset={{bottom: 4,  left:  16}} />
							<Control core={core} name="&#5123;" device={Core.Device.JOYPAD} id={Core.Joypad.UP}     className='arrow'    inset={{bottom: 28, left:  16}} />
							<Control core={core} name="&#5125;" device={Core.Device.JOYPAD} id={Core.Joypad.RIGHT}  className='arrow'    inset={{bottom: 16, left:  28}} />
							<Control core={core} name="L"       device={Core.Device.JOYPAD} id={Core.Joypad.L}      className='shoulder' inset={{bottom: 34, left:  34}} />
							<Control core={core} name="&#183;"  device={Core.Device.JOYPAD} id={Core.Joypad.START}  className='special'  inset={{bottom: 4,  left:  37}} />
						</>
					}
				</IonContent>
			</IonPage>
		</>
	);
}
