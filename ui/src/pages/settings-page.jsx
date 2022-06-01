import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Database from '../services/database';

export const SettingsPage = () => {

	const [settings, setSettings] = useState({});
	const [languages, setLanguages] = useState([]);
	const [options, setOptions] = useState({});
	const [current, setCurrent] = useState(null);

    const pascalify = (str) => {
        return str.replace(/([A-Z])([A-Z]+)/g, (_, c1, c2) => {
            return `${c1.toUpperCase()}${c2.toLowerCase()}`;
        });
    }

    const prettify = (lang) => {
        lang = lang.replace('RETRO_LANGUAGE_', '');

        const main = lang.split('_')[0];
        const sub = lang.split('_')[1];

        return pascalify(main) + (sub ? ` (${pascalify(sub)})` : '');
    };

    const language = async (lang) => {
        if (!settings.configurations)
            return;

        settings.language = lang;

        const updated = await Database.updateSettings(settings);

        setSettings(updated);
    };

    const override = async (item, value) => {
        item.default == value
            ? delete settings.configurations[item.key]
            : settings.configurations[item.key] = value;

        const updated = await Database.updateSettings(settings);

        setSettings(updated);
    }

	useIonViewWillEnter(async () => {
        const settings = await Database.getSettings();
		const languages = await junie_get_languages();
		const options = await junie_get_settings();

		setSettings(settings);
		setLanguages(languages);
		setOptions(options);
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>

            {/* TODO IonAccordion here*/}
			<IonContent class="settings">
                <IonList>
                    <IonItem key="languages">
                        <IonLabel>Language</IonLabel>
                        <IonSelect interface="action-sheet" value={settings.language} onIonChange={e => language(e.detail.value)}>
                            {languages.sort().map(name =>
                                <IonSelectOption key={name} value={name}>{prettify(name)}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    <IonItem key="cores">
                        <IonLabel>System</IonLabel>
                        <IonSelect interface="action-sheet" onIonChange={e => setCurrent(e.detail.value)}>
                            {Object.keys(options).map(name =>
                                <IonSelectOption key={name} value={name}>{name}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    {current && options[current].map(item => 
                        <IonItem key={item.name}>
                            <IonLabel position="floating">{item.name}</IonLabel>
                            <IonSelect interface="action-sheet" value={settings.configurations[item.key]} onIonChange={e => override(item, e.detail.value)}>
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
