import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cloudDownload, cloudUpload } from 'ionicons/icons';
import { useRef, useState } from 'react';
import { Save } from '../entities/Save';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';
import { FixSaveModal } from '../modals/FixSaveModal';
import Database from '../services/Database';
import Requests from '../services/Requests';
import './SavesPage.scss';

export const SavesPage: React.FC = () => {

	let fixing: Save;

	const [loading, setLoading] = useState<boolean>(true);
	const [saves, setSaves] = useState<Save[]>([]);
	const [systems, setSystems] = useState<System[]>([]);

	const showModal = (save: Save) => {
		fixing = save;
		present();
	}

	const deleteSave = async (save: Save) => {
		setLoading(true);

		const saves = await Database.removeSave(save);

		setSaves(saves);
		setLoading(false);
	};

	const backupSave = async () => {
		setLoading(true);

		await new Promise<void>(resolve => {
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

		setLoading(false);
	}

	const restoreSaves = async (files: FileList | null) => {
		if (!files?.length)
			return;

		setLoading(true);

		const data = await files[0].text();
		const save_restore = JSON.parse(data) as Save[];

		for (const save of save_restore) {
			const system = systems.find(x => x.name == save.system);
			const game = system?.games?.find(x => x.rom?.startsWith(save.game!));

			if (system && game)
				await Database.updateSave(save, system, game);
		}

		setSaves(await Database.getSaves());
		setLoading(false);
	}

	const [present, dismiss] = useIonModal(FixSaveModal, {
		systems: systems,
		dismiss: () => dismiss(),
		apply: async (system: System, game: Game) => {
			setLoading(true);

			const saves = await Database.updateSave(fixing, system, game);
			dismiss();

			setSaves(saves);
			setLoading(false);
		}
	});

	useIonViewWillEnter(async () => {
		setLoading(true);

		const saves = await Database.getSaves();
		const systems = await Requests.getSystems();

		setSaves(saves);
		setSystems(systems);

		setLoading(false);
	});

	const fileUpload = useRef<HTMLInputElement>(null);

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

			<IonContent>
				<IonLoading isOpen={loading} />
				<IonList>
					<IonItemGroup>
						{saves.map(save =>
							<IonItemSliding key={save.game}>
								<IonItem lines="full">
									{
										save.isMapped(systems) ?
											<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
											<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
									}
									<IonLabel>
										<h2>{save.game?.replaceAll(/ \(.*\)/g, '')}</h2>
										<h3>{save.system}</h3>
									</IonLabel>
									{
										!save.isMapped(systems) && <IonButton onClick={() => showModal(save)}>Fix</IonButton>
									}
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteSave(save)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						)}
					</IonItemGroup>
				</IonList>
			</IonContent>

		</IonPage>
	);
};
