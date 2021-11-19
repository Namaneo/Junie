import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewDidLeave, useIonViewWillEnter } from "@ionic/react";
import { RouteComponentProps } from "react-router";
import { next } from "../services/Events";
import './EmulatorPage.css';

interface EmulatorProps {
    system: string;
    game: string;
}

export const EmulatorPage: React.FC<RouteComponentProps<EmulatorProps>> = ({ match }) => {

    useIonViewWillEnter(() => next('tabs', false));
    useIonViewDidLeave(() => next('tabs', true));

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