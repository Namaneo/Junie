import { render } from 'react-dom'
import { Redirect, Route } from 'react-router'
import { IonReactHashRouter } from '@ionic/react-router'
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react'
import { cloudDownload, gameController, keyOutline, save } from 'ionicons/icons'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './index.css';

function Recent() {
    return <div>Recent</div>;
}

function Games() {
    return <div>Games</div>;
}

function Saves() {
    return <div>Saves</div>;
}

function Cheats() {
    return <div>Cheats</div>;
}

function Junie() {

    setupIonicReact();

    return (
        <IonApp>
            <IonReactHashRouter>
                <IonTabs>
                    <IonRouterOutlet>
                        <Route path='/recent' component={Recent} />
                        <Route path='/games'  component={Games}  />
                        <Route path='/saves'  component={Saves}  />
                        <Route path='/cheats' component={Cheats} />
                        <Route render={() => <Redirect to='/recent' />} />
                    </IonRouterOutlet>

                    <IonTabBar slot='bottom'>
                        <IonTabButton tab='recent' href='/recent'>
                            <IonIcon icon={gameController} />
                            <IonLabel>Recent</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab='games' href='/games'>
                            <IonIcon icon={cloudDownload} />
                            <IonLabel>Games</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab='saves' href='/saves'>
                            <IonIcon icon={save} />
                            <IonLabel>Saves</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab='cheats' href='/cheats'>
                            <IonIcon icon={keyOutline} />
                            <IonLabel>Cheats</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonTabs>
            </IonReactHashRouter>
        </IonApp>
    );
}

import icon_png from '../res/icon.png'
import favicon_png from '../res/favicon.png'

document.querySelector("link[rel='icon']").href = icon_png;
document.querySelector("link[rel='shortcut icon']").href = favicon_png;
document.querySelector("link[rel='apple-touch-icon']").href = icon_png;

render(<Junie />, document.getElementById('root'));
