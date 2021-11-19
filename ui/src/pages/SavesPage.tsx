import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonModal, useIonViewWillEnter } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Save } from '../entities/Save';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';
import { FixSaveModal } from '../modals/FixSaveModal';
import { getSaves, removeSave, updateSave } from '../services/Database';
import { getSystems } from '../services/Requests';
import './SavesPage.css';

interface SavesState {
  loading: boolean;
  saves: Save[];
  fixing: Save | undefined;
  systems: System[];
  response?: Promise<void>;
}

export const SavesPage: React.FC = () => {

  const [state, setState] = useState<SavesState>({
    loading: true,
    saves: [],
    fixing: undefined,
    systems: [],
  });

  const showModal = (save: Save) => {
    state.fixing = save;
    present();
  }

  const deleteSave = async (save: Save) => {
    state.saves = await removeSave(save);

    setState({ ...state });
  };

  const [present, dismiss] = useIonModal(FixSaveModal, { 
    systems: state.systems,
    dismiss: () => dismiss(),
    apply: async (system: System, game: Game) => {
      state.saves = await updateSave(state.fixing!, system, game);
      dismiss();

      setState({ ...state });
    }
  });

  useIonViewWillEnter(async () => {
    state.saves = await getSaves();
    state.systems = await getSystems();
    state.loading = false;

    setState({ ...state });
  });

  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Saves</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={state.loading} />
        <IonList>
          <IonItemGroup>
            {state.saves.map(save =>
              <IonItemSliding key={save.game}>
                <IonItem lines="full">
                  {
                    save.isMapped(state.systems) ?
                      <IonIcon color="success" icon={checkmarkCircleOutline} slot="start"></IonIcon> :
                      <IonIcon color="danger" icon={closeCircleOutline} slot="start"></IonIcon>
                  }
                  <IonLabel>
                    <h2>{save.game?.replaceAll(/ \(.*\)/g,'')}</h2>
                    <h3>{save.system}</h3>
                  </IonLabel>
                  {
                    !save.isMapped(state.systems) && <IonButton onClick={() => showModal(save)}>Fix</IonButton>
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
