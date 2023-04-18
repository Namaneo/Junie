import { IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { add, checkmarkCircleOutline, closeCircleOutline, buildOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Cheat, CheatList } from '../entities/cheat';
import { EditCheatModal } from '../modals/edit-cheat-modal';
import { System } from '../entities/system';
import { Game } from '../entities/game';
import Files from '../services/files';
import Requests from '../services/requests';

/**
 * @returns {JSX.Element}
 */
export const CheatsPage = () => {
	const [lists,        setLists]        = useState(/** @type {CheatList[]} */ ([]));
	const [systems,      setSystems]      = useState(/** @type {System[]}    */ ([]));
	const [currentList,  setCurrentList]  = useState(/** @type {CheatList}   */ (null) );
	const [currentCheat, setCurrentCheat] = useState(/** @type {Cheat}       */ (null) );

	/**
	 * @param {CheatList} list
	 * @param {Cheat} cheat
	 * @returns {Promise<void>}
	 */
	const deleteCheat = async (list, cheat) => {
		list.cheats = list.cheats.filter(x => x != cheat);

		if (list.cheats.length) {
			await Files.Cheats.update(list);

		} else {
			await Files.Cheats.remove(list);
		}

		setLists(await Files.Cheats.get());
	};

	/**
	 * @param {CheatList} list
	 * @param {System} system
	 * @param {Game} game
	 * @returns {Promise<void>}
	 */
	const apply = async (cheat, system, game) => {
		const list = currentList
			|| lists.find(x => x.system == system.name && x.game == game.name)
			|| CheatList.fromGame(system, game);

		if (cheat != currentCheat)
			list.cheats.push(cheat);

		await Files.Cheats.update(list);
		setLists(await Files.Cheats.get());

		close();
	};

	/**
	 * @param {CheatList} list
	 * @param {Cheat} cheat
	 * @returns {void}
	 */
	const showModal = (list, cheat) => {
		setCurrentList(list);
		setCurrentCheat(cheat);

		open({ initialBreakpoint: 1, breakpoints: [0, 1], cssClass: 'modal' });
	}

	const [open, close] = useIonModal(EditCheatModal, {
		current: currentCheat,
		systems: systems,
		apply: apply,
	});

	useIonViewWillEnter(async () => {
		setLists(await Files.Cheats.get());
		setSystems(await Requests.getSystems());
	});

	return (
		<IonPage className="page">

			<IonHeader>
				<IonToolbar>
					<IonTitle>Cheats</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => showModal()}>
							<IonIcon slot="icon-only" icon={add} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent className="cheats">
				<IonList lines="none">
					{lists.map(list => list.cheats.map(cheat =>
						<IonCard key={list.system + list.game + cheat.name}>
							<IonItemSliding>
								<IonItem color="light">
									{
										cheat.enabled ?
											<IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
											<IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
									}
									<IonLabel>
										<h2>{cheat.name}</h2>
										<h3>{list.game}</h3>
										<h3>{list.system}</h3>
									</IonLabel>
									<IonButton onClick={() => showModal(list, cheat)} fill="clear">
										<IonIcon slot="icon-only" icon={buildOutline} />
									</IonButton>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption color="danger" onClick={() => deleteCheat(list, cheat)}>Delete</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</IonCard>
					))}
				</IonList>
			</IonContent>

		</IonPage>
	);
};
