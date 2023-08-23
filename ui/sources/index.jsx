import { createMemoryHistory } from 'history';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Redirect, Route } from 'react-router';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact, useIonLoading } from '@ionic/react';
import { cloudDownload, gameController, keyOutline, save } from 'ionicons/icons';
import { HomePage } from './pages/home-page';
import { InstallPage } from './pages/install-page';
import { SavesPage } from './pages/saves-page';
import { CheatsPage } from './pages/cheats-page';
import Database from './services/database';
import Files from './services/files';

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

	const [present] = useIonLoading();

	setupIonicReact({
		swipeBackEnabled: false,
	});

	const registerServiceWorker = async () => {
		if (!navigator.serviceWorker)
			return;

		try {
			const origin = location.origin + location.pathname.replace(/\/$/, '');
			const registration = await navigator.serviceWorker.register(`${origin}/service-worker.js`);

			registration.onupdatefound = () => {
				present('Updating...');
				registration.installing.onstatechange = () => location.reload();
			};

			await registration.update();
		} catch (error) {
			console.error(`Registration failed with ${error}`);
		}
	};

	useEffect(() => { registerServiceWorker(); }, []);

	return (
		<IonApp>
			<IonReactMemoryRouter history={createMemoryHistory()}>
				<IonTabs>
					<IonRouterOutlet>
						<Route exact path="/home" component={HomePage} />
						<Route exact path="/install" component={InstallPage} />
						<Route exact path="/saves"  component={SavesPage}  />
						<Route exact path="/cheats" component={CheatsPage} />
						<Route exact path="/" render={() => <Redirect to="/home" />} />
					</IonRouterOutlet>

					<IonTabBar slot="bottom">
						<IonTabButton tab="home" href="/home">
							<IonIcon icon={gameController} />
							<IonLabel>Games</IonLabel>
						</IonTabButton>
						<IonTabButton tab="install" href="/install">
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

try {
	const paths = await Database.list();
	for (const path of paths) {
		const buffer = await Database.read(path);
		await Files.write(path, buffer);
		await Database.remove(path);
	}

} catch (e) {
	console.error(e);
}

createRoot(document.getElementById('root')).render(<Junie />);
