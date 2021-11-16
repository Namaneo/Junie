import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './GamesPage.css';

export const SavesPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Saves</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
      </IonContent>
    </IonPage>
  );
};
