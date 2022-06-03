import { IonAccordion, IonAccordionGroup, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Database from '../services/database';

export const SettingsPage = () => {

	const [settings, setSettings] = useState({});
	const [languages, setLanguages] = useState([]);
	const [bindings, setBindings] = useState({ joypad: [], keyboard: [] });
	const [options, setOptions] = useState({});

    const pascalify = (str) => {
        return str.replace(/([A-Z])([A-Z]+)/g, (_, c1, c2) => {
            return `${c1.toUpperCase()}${c2.toLowerCase()}`;
        });
    }

    const prettify = (lang, prefix) => {
        lang = lang.replace(prefix, '');

        const main = lang.split('_')[0];
        const sub = lang.split('_')[1];

        return pascalify(main) + (sub ? ` (${pascalify(sub)})` : '');
    };

    const language = async (lang) => {
        if (!settings.configurations)
            return;

        settings.language = lang;

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    };

    const bind = async (button, key) => {
        settings.bindings[button] = key;
        if (!key)
            delete settings.bindings[button];

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    }

    const override = async (item, value) => {
        settings.configurations[item.key] = value;
        if (!value)
            delete settings.configurations[item.key];

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    }

	useIonViewWillEnter(async () => {
		setSettings(await Database.getSettings());
		setLanguages(await junie_get_languages());
		setBindings(await junie_get_bindings());
		setOptions(await junie_get_settings());
	});

    // TODO there might be a way to lazy-load accordions content

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent class="settings">

                <IonList lines="full">

                    <IonItem key="languages">
                        <IonLabel>Language</IonLabel>
                        <IonSelect interface="action-sheet" value={settings.language} onIonChange={e => language(e.detail.value)}>
                            {languages.sort().map(name =>
                                <IonSelectOption key={name} value={name}>{prettify(name, 'RETRO_LANGUAGE_')}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    <IonAccordionGroup animated={false}>

                        <IonAccordion>
                            <IonItem slot="header">
                                <IonLabel>Bindings</IonLabel>
                            </IonItem>
                    
                            <IonList slot="content">
                                {bindings.joypad.map(button => 
                                    <IonItem key={button}>
                                        <IonLabel>{prettify(button, 'RETRO_DEVICE_ID_JOYPAD_')}</IonLabel>
                                        <IonSelect interface="action-sheet" value={settings.bindings[button]} onIonChange={e => bind(button, e.detail.value)}>
                                            <IonSelectOption value={null}>...</IonSelectOption>
                                            {bindings.keyboard.map(key =>
                                                <IonSelectOption key={key} value={key}>{prettify(key, 'MTY_KEY_')}</IonSelectOption>
                                            )}
                                        </IonSelect>
                                    </IonItem>
                                )}
                            </IonList>
                        </IonAccordion>

                        {Object.keys(options).map(name =>
                            <IonAccordion key={name}>
                                <IonItem slot="header">
                                    <IonLabel>{name}</IonLabel>
                                </IonItem>
                        
                                <IonList slot="content">
                                    {options[name].map(item => 
                                        <IonItem key={item.name}>
                                            <IonLabel>{item.name}</IonLabel>
                                            <IonSelect interface="action-sheet" value={settings.configurations[item.key]} onIonChange={e => override(item, e.detail.value)}>
                                                <IonSelectOption value={null}>...</IonSelectOption>
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
