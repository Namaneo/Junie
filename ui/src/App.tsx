import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact, useIonAlert } from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import { cloudDownload, gameController, save } from 'ionicons/icons';
import { useState } from 'react';

import { RecentPage } from './pages/RecentPage';
import { SavesPage } from './pages/SavesPage';
import { SystemsPage } from './pages/SystemsPage';
import { GamesPage } from './pages/GamesPage';
import Events from './services/Events';

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

	setupIonicReact({
		swipeBackEnabled: false,
	});

	const [tabs, setTabs] = useState(true);

	const [alert] = useIonAlert();

	Events.subscribe<boolean>('tabs', show => setTabs(show));

	navigator.serviceWorker.onmessage = event => {
		if (event.data == 'install')
			alert({
				header: 'Update available',
				message: 'A new update of Junie is available. Would you like to apply it now?',
				buttons: [
					{ text: 'Later', role: 'dismiss' },
					{ text: 'Apply', handler: () => window.location.reload() },
				]
			});
	};

	return (
		<IonApp>
			<IonReactHashRouter>
				<IonTabs>

					<IonRouterOutlet>
						<Route exact path="/recent" component={RecentPage} />
						<Route exact path="/games" component={SystemsPage} />
						<Route exact path="/games/:system" component={GamesPage} />
						<Route exact path="/saves" component={SavesPage} />

						<Route exact path="/">
							<Redirect to="/recent" />
						</Route>
					</IonRouterOutlet>

					<IonTabBar slot="bottom" hidden={!tabs}>
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
					</IonTabBar>

				</IonTabs>
			</IonReactHashRouter>
		</IonApp>
	)
};

export default App;
