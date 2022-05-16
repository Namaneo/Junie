import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cloudDownload, cloudUpload } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { Save } from '../entities/save';
import { FixSaveModal } from '../modals/fix-save-modal';
import * as Database from '../services/database';
import * as Requests from '../services/requests';

export const SavesPage = () => {

	const [modal, setModal] = useState(false);
	const [current, setCurrent] = useState(null);
	const [saves, setSaves] = useState([]);
	const [systems, setSystems] = useState([]);

	const showModal = (save) => {
		setCurrent(save);
		setModal(true);
	}

	const deleteSave = async (save) => {
		const saves = await Database.removeSave(save);

		setSaves(saves);
	};

	const backupSave = async () => {
		await new Promise(resolve => {
			const a = document.createElement('a');
			document.body.appendChild(a);
			
			const blob = new Blob([JSON.stringify(saves)], { type: 'octet/stream' })

			a.href = URL.createObjectURL(blob);
			a.download = 'junie-save.json';
			a.click();

			URL.revokeObjectURL(a.href);
			document.body.removeChild(a);

			resolve();
		});
	}

	const restoreSaves = async (files) => {
		if (!files?.length)
			return;

		const data = await files[0].text();
		const save_restore = JSON.parse(data);

		for (const save of save_restore) {
			const system = systems.find(x => x.name == save.system);
			const game = system?.games?.find(x => x.rom?.startsWith(save.game));

			if (system && game)
				await Database.updateSave(save, system, game);
		}

		setSaves(await Database.getSaves());
	}

	const apply = async (system, game) => {
		const saves = await Database.updateSave(current, system, game);
		setModal(false);

		setSaves(saves);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		const saves = await Database.getSaves();
		const systems = await Requests.getSystems();

		setSaves(saves);
		setSystems(systems);
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

				<IonList>
					<IonItemGroup>
						{saves.map(save =>
							<IonCard key={save.game}>
								<IonItemSliding>
									<IonItem>
										{
											save.mapped ?
												<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
												<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
										}
										<IonLabel>
											<h2>{save.game?.replaceAll(/ \(.*\)/g, '')}</h2>
											<h3>{save.system}</h3>
										</IonLabel>
										{!save.mapped && <IonButton onClick={() => showModal(save)}>Fix</IonButton>}
									</IonItem>
									<IonItemOptions side="end">
										<IonItemOption color="danger" onClick={() => deleteSave(save)}>Delete</IonItemOption>
									</IonItemOptions>
								</IonItemSliding>
							</IonCard>
						)}
					</IonItemGroup>
				</IonList>
			</IonContent>

		</IonPage>
	);
};
