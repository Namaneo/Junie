import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Database from '../services/database';

export const SettingsPage = () => {

	const [settings, setSettings] = useState({});
	const [overrides, setOverrides] = useState({});
	const [current, setCurrent] = useState(null);

    const override = async (item, value) => {
        item.default == value
            ? delete overrides[item.key]
            : overrides[item.key] = value;

        const stored = await Database.updateSettings(overrides);

        setOverrides(stored);
    }

	useIonViewWillEnter(async () => {
		const settings = await junie_get_settings();
        const stored = await Database.getSettings();

		setSettings(settings);
		setOverrides(stored);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent class="settings">
                <IonList>

                    <IonItem>
                        <IonLabel>System</IonLabel>
                        <IonSelect interface="action-sheet" onIonChange={e => setCurrent(e.detail.value)}>
                            {Object.keys(settings).map(name =>
                                <IonSelectOption key={name} value={name}>{name}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    {current && settings[current].map(item => 
                        <IonItem key={item.name}>
                            <IonLabel position="stacked">{item.name}</IonLabel>
                            <IonSelect interface="action-sheet" value={overrides[item.key] ?? item.default} onIonChange={e => override(item, e.detail.value)}>
                                {item.options.map(option =>
                                    <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                                )}
                            </IonSelect>
                        </IonItem>
                    )}

                </IonList>
			</IonContent>

		</IonPage>
	);
};
