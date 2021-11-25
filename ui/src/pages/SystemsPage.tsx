import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { System } from '../interfaces/System';
import Requests from '../services/Requests';
import './SystemsPage.css';

interface SystemsState {
  loading: boolean;
  systems: System[];
  response?: Promise<any>;
}

export const SystemsPage: React.FC = () => {

  //Initialize default state
  const [state, setState] = useState<SystemsState>({
    loading: true,
    systems: []
  });

  //Retrieve data on open
  useEffect(() => {
    if (state.response)
      return;

    state.response = Requests.getSystems().then(systems => {
      state.systems = systems;
      state.loading = false;

      setState({ ...state });
    });
  });

  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Systems</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={state.loading} />
        {state.systems.map(system =>
          <IonCard className="system-card" key={system.name} routerLink={`/games/${system.name}`}>
            <img src={Requests.getSystemCover(system)} />
            <IonCardHeader>
              <IonCardSubtitle>{system.coreName}</IonCardSubtitle>
            </IonCardHeader>
          </IonCard>
        )}
      </IonContent>

    </IonPage>
  );
};
