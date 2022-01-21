import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
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

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Saves</IonTitle>
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
