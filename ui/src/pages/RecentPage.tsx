import { IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonItem, IonItemGroup, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { trash } from 'ionicons/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../interfaces/Game';
import { System } from '../interfaces/System';
import Caches from '../services/Caches';
import Requests from '../services/Requests';
import './RecentPage.css';

interface RecentState {
  loading: boolean;
  played: { request: Request, system: System, game: Game }[];
}

export const RecentPage: React.FC = () => {

  const [state, setState] = useState<RecentState>({
    loading: true,
    played: [],
  });

  const retrieveGames = async () => {
    const systems = await Requests.getSystems();
    const cachedGames = await Caches.getGames();

    state.played = [];

    for (const cachedGame of cachedGames) {
      const system = systems.find(system => system.name == cachedGame.system);
      if (!system)
        continue;

      const game = system.games.find(game => game.rom == cachedGame.game);
      if (!game)
        continue;

      state.played.push({ request: cachedGame.request, system, game });
    }

    state.played.reverse();
    state.loading = false;

    setState({ ...state });
  }

  const deleteGame = async (event: React.MouseEvent, request: Request) => {
    event.stopPropagation();
    event.preventDefault();

    await Caches.remove(request);

    await retrieveGames();
  }

  useIonViewWillEnter(retrieveGames);

  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Recent</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={state.loading} />
        {state.played.map(played =>
          <Link className="game" key={played.game.name} to={`/games/${played.system.name}/${played.game.rom}`}>
            <IonCard className="card">
              <img src={played.game.cover} />
              <IonCardHeader class="header">
                <IonCardSubtitle>{played.game.name}</IonCardSubtitle>
              </IonCardHeader>
              <IonButton fill="clear" color="danger" onClick={e => deleteGame(e, played.request)}>
                <IonIcon icon={trash} />
              </IonButton>
            </IonCard>
          </Link>
        )}
      </IonContent>

    </IonPage>
  );
};
