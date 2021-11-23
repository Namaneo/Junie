import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from '../entities/Save';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';
import { getSaves } from '../services/Database';
import { getSystems } from '../services/Requests';
import './RecentPage.css';

interface RecentState {
  loading: boolean;
  played: { system: System, game: Game}[];
}

export const RecentPage: React.FC = () => {

  const [state, setState] = useState<RecentState>({
    loading: true,
    played: [],
  });

  useIonViewWillEnter(async () => {
    const saves = await getSaves();
    const systems = await getSystems();
    
    state.played = [];

    for (const save of saves) {
      if (!save.isMapped(systems))
        continue;

      const system = save.getSystem(systems);
      const game = save.getGame(system);

      state.played.push({ system, game });
    }

    state.loading = false;

    setState({ ...state });
  });

  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={state.loading} />
        {state.played.map(played =>
          <Link className="game" key={played.game.name} to={`/games/${played.system.name}/${played.game.rom}`}>
            <IonCard className="card">
              <img src={played.game.cover} />
              <IonCardHeader className="header">
                <IonCardSubtitle>{played.game.name}</IonCardSubtitle>
              </IonCardHeader>
            </IonCard>
          </Link>
        )}
      </IonContent>

    </IonPage>
  );
};
