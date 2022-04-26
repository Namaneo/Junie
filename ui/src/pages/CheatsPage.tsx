import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { add, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Cheat } from '../entities/Cheat';
import { System } from '../interfaces/System';
import { EditCheatModal } from '../modals/EditCheatModal';
import Database from '../services/Database';
import Requests from '../services/Requests';
import './CheatsPage.scss';

export const CheatsPage: React.FC = () => {

	const [modal, setModal] = useState<boolean>(false);
	const [current, setCurrent] = useState<Cheat>(new Cheat());
	const [loading, setLoading] = useState<boolean>(true);
	const [cheats, setCheats] = useState<Cheat[]>([]);
	const [systems, setSystems] = useState<System[]>([]);

	const showModal = (cheat: Cheat) => {
		setCurrent(cheat);
		setModal(true);
	}

	const deleteCheat = async (cheat: Cheat) => {
		setLoading(true);

		const cheats = await Database.removeCheat(cheat);

		setCheats(cheats);
		setLoading(false);
	};

	const apply = async (cheat: Cheat) => {
		setLoading(true);

		const cheats = await Database.updateCheat(cheat);
		setModal(false);

		setCheats(cheats);
		setLoading(false);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		setLoading(true);

		const cheats = await Database.getCheats();
		const systems = await Requests.getSystems();

		setCheats(cheats);
		setSystems(systems);

		setLoading(false);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Cheats</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => showModal(new Cheat())}>
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent>
				<IonLoading isOpen={loading} />

				<IonModal isOpen={modal}>
					<EditCheatModal current={current} systems={systems} apply={apply} dismiss={dismiss}  />
				</IonModal>

				<IonList>
					<IonItemGroup>
						{cheats.map(cheat =>
							<IonItemSliding key={cheat.name}>
								<IonItem lines="full">
									{
										cheat.enabled ?
											<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
											<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
									}
									<IonLabel>
										<h2>{cheat.name}</h2>
										<h3>{cheat.game?.replaceAll(/ \(.*\)|\.[a-z]+/g, '')}</h3>
										<h3>{cheat.system}</h3>
									</IonLabel>
									<IonButton onClick={() => showModal(cheat)}>Edit</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteCheat(cheat)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						)}
					</IonItemGroup>
				</IonList>
			</IonContent>

		</IonPage>
	);
};
