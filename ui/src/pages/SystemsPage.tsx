import { IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { System } from '../models/System';
import { apiHost, getSystemCover, getSystems } from '../services/Requests';
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

    state.response = getSystems().then(systems => {
      state.systems = systems;
      state.loading = false;

      setState({ ...state });
    });
  });

  //Show loader while loading data
  if (state.loading)
    return <IonLoading isOpen />;

  //Display all systems cards
  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Systems</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {state.systems.map(system =>
          <IonCard key={system.name} class="system-card" routerLink={`/games/${system.name}`}>
            <img src={getSystemCover(system)} />
            <IonCardHeader>
              <IonCardSubtitle>{system.coreName}</IonCardSubtitle>
            </IonCardHeader>
          </IonCard>
        )}
      </IonContent>

    </IonPage>
  );
};
