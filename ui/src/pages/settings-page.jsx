import { IonAccordion, IonAccordionGroup, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Database from '../services/database';

export const SettingsPage = () => {

	const [settings, setSettings] = useState({});
	const [languages, setLanguages] = useState([]);
	const [options, setOptions] = useState({});

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
        settings.configurations[item.key] = value;

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

			<IonContent class="settings">

                <IonList lines="none">
                    <IonItem key="languages">
                        <IonLabel>Language</IonLabel>
                        <IonSelect interface="action-sheet" value={settings.language} onIonChange={e => language(e.detail.value)}>
                            {languages.sort().map(name =>
                                <IonSelectOption key={name} value={name}>{prettify(name)}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    <IonAccordionGroup animated={false}>
                        {Object.keys(options).map(name =>
                            <IonAccordion key={name}>
                                <IonItem slot="header">
                                    <IonLabel>{name}</IonLabel>
                                </IonItem>
                        
                                <IonList slot="content" lines="none">
                                    {options[name].map(item => 
                                        <IonItem key={item.name}>
                                            <IonLabel>{item.name}</IonLabel>
                                            <IonSelect interface="action-sheet" value={settings.configurations[item.key]} onIonChange={e => override(item, e.detail.value)}>
                                                {item.options.map(option =>
                                                    <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                                                )}
                                            </IonSelect>
                                        </IonItem>
                                    )}
                                </IonList>
                            </IonAccordion>
                        )}
                    </IonAccordionGroup>

                </IonList>
			</IonContent>

		</IonPage>
	);
};
