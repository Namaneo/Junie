import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";
import { Game } from "../interfaces/Game";
import { getGames } from "../services/Requests";
import './GamesPage.css';

interface GamesProps {
  system: string;
}

interface GamesState {
  loading: boolean;
  games: Game[];
  response?: Promise<any>;
}

export const GamesPage: React.FC<RouteComponentProps<GamesProps>> = ({ match }) => {

  //Initialize default state
  const [state, setState] = useState<GamesState>({
    loading: true,
    games: []
  });

  //Retrieve data on open
  useEffect(() => {
    if (state.response)
      return;

    state.response = getGames(match.params.system).then(games => {
      state.games = games;
      state.loading = false;

      setState({ ...state });
    });
  });

  //Show loader while loading data
  if (state.loading)
    return <IonPage><IonLoading isOpen /></IonPage>;

  //Display all games cards
  return (
    <IonPage>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Games</IonTitle>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {state.games.map(game =>
          <Link className="game" key={game.name} to={`/games/${match.params.system}/${game.rom}`}>
            <IonCard className="card">
              <img src={game.cover} />
              <IonCardHeader className="header">
                <IonCardSubtitle>{game.name}</IonCardSubtitle>
              </IonCardHeader>
            </IonCard>
          </Link>
        )}
      </IonContent>

    </IonPage>
  );
}