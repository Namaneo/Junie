import { createMemoryHistory } from 'history'
import { StrictMode } from 'react'
import { render } from 'react-dom'
import { Redirect, Route } from 'react-router'
import { IonReactMemoryRouter } from '@ionic/react-router'
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react'
import { cloudDownload, gameController, keyOutline, save, settingsOutline } from 'ionicons/icons'
import { RecentPage } from './pages/recent-page'
import { SystemsPage } from './pages/systems-page'
import { GamesPage } from './pages/games-page'
import { SavesPage } from './pages/saves-page'
import { CheatsPage } from './pages/cheats-page'
import { SettingsPage } from './pages/settings-page'

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

/* Application stylesheets */
import './styles/theme.css';
import './styles/index.css';

function Junie() {

	setupIonicReact();

    return (
        <IonApp>
            <IonReactMemoryRouter history={createMemoryHistory()}>
                <IonTabs>
                    <IonRouterOutlet>
                        <Route exact path="/recent" component={RecentPage} />
                        <Route exact path="/games" component={SystemsPage} />
						<Route exact path="/games/:system" component={GamesPage} />
                        <Route exact path="/saves"  component={SavesPage}  />
                        <Route exact path="/cheats" component={CheatsPage} />
                        <Route exact path="/settings" component={SettingsPage} />
                        <Route exact path="/" render={() => <Redirect to="/recent" />} />
                    </IonRouterOutlet>

                    <IonTabBar slot="bottom">
                        <IonTabButton tab="recent" href="/recent">
                            <IonIcon icon={gameController} />
                            <IonLabel>Games</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="games" href="/games">
                            <IonIcon icon={cloudDownload} />
                            <IonLabel>Install</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="saves" href="/saves">
                            <IonIcon icon={save} />
                            <IonLabel>Saves</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="cheats" href="/cheats">
                            <IonIcon icon={keyOutline} />
                            <IonLabel>Cheats</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab="settings" href="/settings">
                            <IonIcon icon={settingsOutline} />
                            <IonLabel>Settings</IonLabel>
                        </IonTabButton>
                    </IonTabBar>
                </IonTabs>
            </IonReactMemoryRouter>
        </IonApp>
    );
}

render(<StrictMode><Junie /></StrictMode>, document.getElementById('root'));
