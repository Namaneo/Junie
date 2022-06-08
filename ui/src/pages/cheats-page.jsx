import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { add, checkmarkCircleOutline, closeCircleOutline, buildOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Cheat } from '../entities/cheat';
import { EditCheatModal } from '../modals/edit-cheat-modal';
import * as Requests from '../services/requests';
import * as Database from "../services/database";

export const CheatsPage = () => {

	const [modal, setModal] = useState(false);
	const [current, setCurrent] = useState(null);
	const [cheats, setCheats] = useState([]);
	const [systems, setSystems] = useState([]);

	const showModal = (cheat) => {
		setCurrent(cheat);
		setModal(true);
	}

	const deleteCheat = async (cheat) => {
		await Database.removeCheat(cheat);

		setCheats(await Database.getCheats());
	};

	const apply = async (cheat, key) => {
		await Database.updateCheat(cheat, key);

		setCheats(await Database.getCheats());
		setModal(false);
	};

	const dismiss = () => {
		setModal(false);
	}

	useIonViewWillEnter(async () => {
		setCheats(await Database.getCheats());
		setSystems(await Requests.getSystems());
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

			<IonContent class="cheats">
				<IonModal isOpen={modal}>
					<EditCheatModal current={current} systems={systems} apply={apply} dismiss={dismiss}  />
				</IonModal>

				<IonList lines="none">
					{cheats.map(cheat =>
						<IonCard key={cheat.name}>
							<IonItemSliding>
								<IonItem color="light">
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
									<IonButton onClick={() => showModal(cheat)} fill="clear">
										<IonIcon slot="icon-only" icon={buildOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteCheat(cheat)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					)}
				</IonList>
			</IonContent>

		</IonPage>
	);
};
