import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cloudDownload, cloudUpload, buildOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { FixSaveModal } from '../modals/fix-save-modal';
import { System } from '../entities/system';
import { Save } from '../entities/save';
import Database from '../services/database';
import Requests from '../services/requests';
import Files from '../services/files';
import Zip from '../services/zip';

export const SavesPage = () => {

	const [modal,   setModal]   = useState(/** @type {boolean}  */ (false));
	const [current, setCurrent] = useState(/** @type {Save}     */ (null) );
	const [saves,   setSaves]   = useState(/** @type {Save[]}   */ ([])   );
	const [systems, setSystems] = useState(/** @type {System[]} */ ([])   );

	const page = useRef(null);
	const [presenting, setPresenting] = useState(null);
	useEffect(() => setPresenting(page.current), []);

	for (const save of saves)
		save.mapped = save.isMapped(systems);

	const showModal = (save) => {
		setCurrent(save);
		setModal(true);
	}

	const deleteSave = async (save) => {
		await Files.Saves.remove(save);

		setSaves(await Files.Saves.get());
	};

	const backupSave = async () => {
		await new Promise(async resolve => {
			const a = document.createElement('a');
			document.body.appendChild(a);

			const files = []
			for (const save of saves)
				for (const path of save.paths)
					files.push({ path, data: await Database.read(path) });

			const content = await Zip.compress(files);
			const blob = new Blob([content], { type: 'octet/stream' })

			a.href = URL.createObjectURL(blob);
			a.download = `junie-${Date.now()}.zip`;
			a.click();

			URL.revokeObjectURL(a.href);
			document.body.removeChild(a);

			resolve();
		});
	}

	const restoreSaves = async (input) => {
		if (!input?.length)
			return;

		const content = new Uint8Array(await input[0].arrayBuffer());
		const files = await Zip.decompress(content);

		fileUpload.current.value = '';

		for (const file of files)
			await Files.write(file.path, file.data);

		setSaves(await Files.Saves.get());
	}

	const apply = async (system, game) => {
		await Files.Saves.fix(current, system, game);

		setSaves(await Files.Saves.get());
		setModal(false);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
		setSaves(await Files.Saves.get());
	});

	const fileUpload = useRef(null);

	return (
		<IonPage ref={page}>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Saves</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => backupSave()}>
							<IonIcon slot="icon-only" icon={cloudDownload} />
						</IonButton>
						<IonButton onClick={() => fileUpload?.current?.click()}>
							<input type="file" ref={fileUpload} onChange={e => restoreSaves(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={cloudUpload} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="saves">
				<IonModal isOpen={modal} presentingElement={presenting}>
					<FixSaveModal systems={systems} apply={apply} dismiss={dismiss}  />
				</IonModal>

				<IonList lines="none">
					{saves.map(save =>
						<IonCard key={save.game}>
							<IonItemSliding>
								<IonItem color="light">
									{
										save.mapped ?
											<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
											<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
									}
									<IonLabel>
										<h2>{save.game?.replaceAll(/ \(.*\)/g, '')}</h2>
										<h3>{save.system}</h3>
									</IonLabel>
									<IonButton onClick={() => showModal(save)} fill="clear">
										<IonIcon slot="icon-only" icon={buildOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteSave(save)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					)}
				</IonList>
			</IonContent>

		</IonPage>
	);
};
