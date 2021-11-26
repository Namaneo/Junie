import { IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonLoading, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from "@ionic/react";
import { useState } from "react";
import { RouteComponentProps } from "react-router";
import { Link } from "react-router-dom";
import { Game } from "../interfaces/Game";
import Requests from "../services/Requests";
import './GamesPage.css';

interface GamesProps {
  system: string;
}

export const GamesPage: React.FC<RouteComponentProps<GamesProps>> = ({ match }) => {

  const [loading, setLoading] = useState<boolean>(true)
  const [games, setGames] = useState<Game[]>([]);

  useIonViewWillEnter(async () => {
    setLoading(true);

    const games = await Requests.getGames(match.params.system);

    setGames(games);
    setLoading(false);
  });

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
        <IonLoading isOpen={loading} />
        {games.map(game =>
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