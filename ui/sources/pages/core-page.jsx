import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import Core from '../services/core';
import Files from '../services/files';

const Control = ({ core, name, device, id, className, style }) => {
	const down = (e) => { core.send(device, id, 1); e.preventDefault(); };
	const up = (e) => { core.send(device, id, 0); e.preventDefault(); };

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
	const canvas = useRef(null);

	useEffect(() => {
		const start = async () => {
			await core.init();
			await core.prepare(match.params.system, match.params.game);

			core.start(await Files.Settings.get(), canvas.current);
		}

		start();

		return () => core.stop();
	}, []);

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>{match.params.game}</IonTitle>
					<IonButtons slot="start">
						<IonBackButton />
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="core">
				<canvas ref={canvas} />

				<Control core={core} name="A"      device={Core.Device.JOYPAD} id={Core.Joypad.A}      className='generic' style={{bottom: '16vw', right: '4vw' }} />
				<Control core={core} name="B"      device={Core.Device.JOYPAD} id={Core.Joypad.B}      className='generic' style={{bottom: '4vw',  right: '16vw'}} />
				<Control core={core} name="X"      device={Core.Device.JOYPAD} id={Core.Joypad.X}      className='generic' style={{bottom: '28vw', right: '16vw'}} />
				<Control core={core} name="Y"      device={Core.Device.JOYPAD} id={Core.Joypad.Y}      className='generic' style={{bottom: '16vw', right: '28vw'}} />
				<Control core={core} name="R"      device={Core.Device.JOYPAD} id={Core.Joypad.R}      className='generic' style={{bottom: '34vw', right: '34vw'}} />
				<Control core={core} name="Select" device={Core.Device.JOYPAD} id={Core.Joypad.SELECT} className='generic' style={{bottom: '4vw',  right: '37vw'}} />

				<Control core={core} name="Left"   device={Core.Device.JOYPAD} id={Core.Joypad.LEFT}   className='generic' style={{bottom: '16vw', left:  '4vw' }} />
				<Control core={core} name="Down"   device={Core.Device.JOYPAD} id={Core.Joypad.DOWN}   className='generic' style={{bottom: '4vw',  left:  '16vw'}} />
				<Control core={core} name="Up"     device={Core.Device.JOYPAD} id={Core.Joypad.UP}     className='generic' style={{bottom: '28vw', left:  '16vw'}} />
				<Control core={core} name="Right"  device={Core.Device.JOYPAD} id={Core.Joypad.RIGHT}  className='generic' style={{bottom: '16vw', left:  '28vw'}} />
				<Control core={core} name="L"      device={Core.Device.JOYPAD} id={Core.Joypad.L}      className='generic' style={{bottom: '34vw', left:  '34vw'}} />
				<Control core={core} name="Start"  device={Core.Device.JOYPAD} id={Core.Joypad.START}  className='generic' style={{bottom: '4vw',  left:  '37vw'}} />
			</IonContent>

		</IonPage>
	);
}
