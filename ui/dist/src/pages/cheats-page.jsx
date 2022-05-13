import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { add, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Cheat } from '../entities/cheat';
import { EditCheatModal } from '../modals/edit-cheat-modal';
import * as Database from '../services/database';
import * as Requests from '../services/requests';

export const CheatsPage = () => {

	const [modal, setModal] = useState(false);
	const [current, setCurrent] = useState(new Cheat());
	const [cheats, setCheats] = useState([]);
	const [systems, setSystems] = useState([]);

	const showModal = (cheat) => {
		setCurrent(cheat);
		setModal(true);
	}

	const deleteCheat = async (cheat) => {
		const cheats = await Database.removeCheat(cheat);

		setCheats(cheats);
	};

	const apply = async (cheat) => {
		const cheats = await Database.updateCheat(cheat);
		setModal(false);

		setCheats(cheats);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		const cheats = await Database.getCheats();
		const systems = await Requests.getSystems();

		setCheats(cheats);
		setSystems(systems);
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
