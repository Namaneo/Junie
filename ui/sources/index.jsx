import { createMemoryHistory } from 'history';
import { createRoot } from 'react-dom/client';
import { Redirect, Route } from 'react-router';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { cloudDownload, gameController, keyOutline, save } from 'ionicons/icons';
import { HomePage } from './pages/home-page';
import { SystemsPage } from './pages/systems-page';
import { GamesPage } from './pages/games-page';
import { SavesPage } from './pages/saves-page';
import { CheatsPage } from './pages/cheats-page';
import { CorePage } from './pages/core-page';

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

	setupIonicReact({
		swipeBackEnabled: false,
	});

	return (
		<IonApp>
			<IonReactMemoryRouter history={createMemoryHistory()}>
				<IonTabs>
					<IonRouterOutlet>
						<Route exact path="/home" component={HomePage} />
						<Route exact path="/home/:lib/:system/:rom" component={CorePage} />
						<Route exact path="/games" component={SystemsPage} />
						<Route exact path="/games/:system" component={GamesPage} />
						<Route exact path="/saves"  component={SavesPage}  />
						<Route exact path="/cheats" component={CheatsPage} />
						<Route exact path="/" render={() => <Redirect to="/home" />} />
					</IonRouterOutlet>

					<IonTabBar slot="bottom">
						<IonTabButton tab="home" href="/home">
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
					</IonTabBar>
				</IonTabs>
			</IonReactMemoryRouter>
		</IonApp>
	);
}

createRoot(document.getElementById('root')).render(<Junie />);
