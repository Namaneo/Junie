import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cloudDownload, cloudUpload, buildOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { FixSaveModal } from '../modals/fix-save-modal';
import * as Requests from '../services/requests';
import * as Database from "../services/database";
import * as Helpers from "../services/helpers";

export const SavesPage = () => {

	const [modal, setModal] = useState(false);
	const [current, setCurrent] = useState(null);
	const [saves, setSaves] = useState([]);
	const [systems, setSystems] = useState([]);

	for (let save of saves)
		save.mapped = save.isMapped(systems);

	const showModal = (save) => {
		setCurrent(save);
		setModal(true);
	}

	const deleteSave = async (save) => {
		await Database.removeSave(save);

		setSaves(await Database.getSaves());
	};

	const backupSave = async () => {
		await new Promise(async resolve => {
			const a = document.createElement('a');
			document.body.appendChild(a);

			const files = saves.reduce((acc, save) => acc.concat(save.files), []);
			const content = await Helpers.zip(files);
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

		const content = await input[0].arrayBuffer();
		const files = await Helpers.unzip(content);

		fileUpload.current.value = '';

		for (const file of files)
			await Database.write(file.path, file.data);

		setSaves(await Database.getSaves());
	}

	const apply = async (system, game) => {
		await Database.fixSave(current, system, game);

		setSaves(await Database.getSaves());
		setModal(false);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		setSystems(await Requests.getSystems());
		setSaves(await Database.getSaves());
	});

	const fileUpload = useRef(null);

	return (
		<IonPage>

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

			<IonContent class="saves">
				<IonModal isOpen={modal}>
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
