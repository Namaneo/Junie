import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { RouteComponentProps } from "react-router";
import './EmulatorPage.css';

interface EmulatorProps {
    system: string;
    game: string;
}

export const EmulatorPage: React.FC<RouteComponentProps<EmulatorProps>> = ({ match }) => {
    return (
        <IonPage>

            <IonHeader>
                <IonToolbar>
                    <IonTitle>{match.params.system}</IonTitle>
                    <IonButtons slot="start">
                        <IonBackButton />
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <iframe className="emulator" src={`emulator/${match.params.system}/${match.params.game}`}></iframe>
            </IonContent>

        </IonPage>
    );
}