import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './HomePage.css';

export const HomePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
      </IonContent>
    </IonPage>
  );
};
