import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cloudDownload, cloudUpload, buildOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { FixSaveModal } from '../modals/fix-save-modal';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import { Save } from '../entities/save';
import Database from '../services/database';
import Requests from '../services/requests';
import Files from '../services/files';
import Zip from '../services/zip';

/**
 * @returns {JSX.Element}
 */
export const SavesPage = () => {
	const fileInput = useRef(null);

	const [modal,   setModal]   = useState(/** @type {boolean}  */ (false));
	const [current, setCurrent] = useState(/** @type {Save}     */ (null) );
	const [saves,   setSaves]   = useState(/** @type {Save[]}   */ ([])   );
	const [systems, setSystems] = useState(/** @type {System[]} */ ([])   );

	for (const save of saves)
		save.mapped = save.isMapped(systems);

	/**
	 * @param {Save} save
	 * @returns {void}
	 */
	const showModal = (save) => {
		setCurrent(save);
		setModal(true);
	}

	/**
	 * @param {Save} save
	 * @returns {Promise<void>}
	 */
	const deleteSave = async (save) => {
		await Files.Saves.remove(save);

		setSaves(await Files.Saves.get());
	};

	/**
	 * @returns {Promise<void>}
	 */
	const backupSave = async () => {
		const a = document.createElement('a');
		document.body.appendChild(a);

		const files = []
		for (const save of saves)
			for (const path of save.paths)
				files.push(await Database.file(path));

		const blob = await Zip.compress(files);

		a.href = URL.createObjectURL(blob);
		a.download = `junie-${Date.now()}.zip`;
		a.click();

		URL.revokeObjectURL(a.href);
		document.body.removeChild(a);
	}

	/**
	 * @param {FileList} input
	 * @returns {Promise<void>}
	 */
	const restoreSaves = async (input) => {
		if (!input?.length)
			return;

		const files = await Zip.decompress(input[0]);

		fileInput.current.value = '';

		for (const file of files)
			await Database.add(file.name, file);

		setSaves(await Files.Saves.get());
	}

	/**
	 * @param {System} system
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const apply = async (system, game) => {
		await Files.Saves.fix(current, system, game);

		setSaves(await Files.Saves.get());
		setModal(false);
	};

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
		setSaves(await Files.Saves.get());
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Saves</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => backupSave()}>
							<IonIcon slot="icon-only" icon={cloudDownload} />
						</IonButton>
						<IonButton onClick={() => fileInput?.current?.click()}>
							<input type="file" ref={fileInput} onChange={e => restoreSaves(e.target.files)} hidden />
							<IonIcon slot="icon-only" icon={cloudUpload} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="saves">
				<FixSaveModal isOpen={modal} systems={systems} apply={apply} dismiss={() => setModal(false)} />

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
