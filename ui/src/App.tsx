import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, gameController, save } from 'ionicons/icons';
import { setupConfig } from '@ionic/core';
import { useState } from 'react';

import { HomePage } from './pages/HomePage';
import { SavesPage } from './pages/SavesPage';
import { SystemsPage } from './pages/SystemsPage';
import { GamesPage } from './pages/GamesPage';
import { EmulatorPage } from './pages/EmulatorPage';
import { subscribe } from './services/Events';

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
import './theme/variables.css';

const App: React.FC = () => {

  setupConfig({
    swipeBackEnabled: false,
  });

  const [tabs, setTabs] = useState(true);

  subscribe<boolean>('tabs', show => setTabs(show));

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>

          <IonRouterOutlet>
            <Route exact path="/home" component={HomePage} />
            <Route exact path="/games" component={SystemsPage} />
            <Route exact path="/games/:system" component={GamesPage} />
            <Route exact path="/games/:system/:game" component={EmulatorPage} />
            <Route exact path="/saves" component={SavesPage} />

            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom" hidden={!tabs}>
            <IonTabButton tab="home" href="/home">
              <IonIcon icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="games" href="/games">
              <IonIcon icon={gameController} />
              <IonLabel>Games</IonLabel>
            </IonTabButton>
            <IonTabButton tab="saves" href="/saves">
              <IonIcon icon={save} />
              <IonLabel>Saves</IonLabel>
            </IonTabButton>
          </IonTabBar>

        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )
};

export default App;
