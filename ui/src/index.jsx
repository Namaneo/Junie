import { render } from 'react-dom'
import { Redirect, Route } from 'react-router'
import { IonReactHashRouter } from '@ionic/react-router'
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react'
import { cloudDownload, gameController, keyOutline, save } from 'ionicons/icons'
import { RecentPage } from './pages/recent-page'
import { SystemsPage } from './pages/systems-page'
import { GamesPage } from './pages/games-page'
import { CheatsPage } from './pages/cheats-page'
import { SavesPage } from './pages/saves-page'
import * as Helpers from './services/helpers'
import icon_png from '../res/icon.png'
import favicon_png from '../res/favicon.png'

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
            <IonReactHashRouter>
                <IonTabs>
                    <IonRouterOutlet>
                        <Route exact path='/recent' component={RecentPage} />
                        <Route exact path="/games" component={SystemsPage} />
						<Route exact path="/games/:system" component={GamesPage} />
                        <Route exact path='/saves'  component={SavesPage}  />
                        <Route exact path='/cheats' component={CheatsPage} />
                        <Route render={() => <Redirect to='/recent' />} />
                    </IonRouterOutlet>

                    <IonTabBar slot='bottom'>
                        <IonTabButton tab='recent' href='/recent'>
                            <IonIcon icon={gameController} />
                            <IonLabel>Games</IonLabel>
                        </IonTabButton>
                        <IonTabButton tab='games' href='/games'>
                            <IonIcon icon={cloudDownload} />
                            <IonLabel>Install</IonLabel>
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

const icon_blob = Helpers.createObjectUrl(icon_png);
const favicon_blob = Helpers.createObjectUrl(favicon_png);

document.querySelector("link[rel='icon']").href = icon_blob;
document.querySelector("link[rel='shortcut icon']").href = favicon_blob;
document.querySelector("link[rel='apple-touch-icon']").href = icon_blob;

render(<Junie />, document.getElementById('root'));
