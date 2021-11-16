import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { RouteComponentProps } from "react-router";
import './EmulatorPage.css';

interface EmulatorProps {
    system: string;
    game: string;
}

export const EmulatorPage: React.FC<RouteComponentProps<EmulatorProps>> = ({ match }) => {

    // const onLoad = () => {
    //     const frame = window.frames[0];
    //     const _fetch = frame.fetch
    //     frame.fetch = (request) => {
    //         console.log(request);
    //         return _fetch(request);
    //     }
    // }

    //Display game emulator
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