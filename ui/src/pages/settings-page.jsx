import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Database from '../services/database';

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

const EditModal = ({ open, dismiss, data }) => {

    return (
        <IonModal isOpen={open}>
            <IonHeader>
				<IonToolbar>
					<IonTitle>{data.name}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={dismiss}>Close</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent class="modal">

                <IonList>
                    {data.items?.map(item => 
                        <IonItem key={item.key}>
                            <IonLabel>{item.name}</IonLabel>
                            <IonSelect interface="action-sheet" value={data.current[item.key]} onIonChange={e => data.update(item.key, e.detail.value)}>
                                <IonSelectOption value={null}>...</IonSelectOption>
                                {item.options?.map(option =>
                                    <IonSelectOption key={option.key} value={option.key}>{option.name}</IonSelectOption>
                                )}
                            </IonSelect>
                        </IonItem>
                    )}
                </IonList>

			</IonContent>
        </IonModal>
    );
}

export const SettingsPage = () => {

	const [modal, setModal] = useState(false);
    const [data, setData] = useState({});

	const [settings, setSettings] = useState({});
	const [languages, setLanguages] = useState([]);
	const [bindings, setBindings] = useState({ joypad: [], keyboard: [] });
	const [options, setOptions] = useState({});

    const language = async (lang) => {
        if (!settings.configurations)
            return;

        settings.language = lang;

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    };

    const adaptive_framerate = async (value) => {
        if (!settings.configurations)
            return;

        settings.adaptive_framerate = value;

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
        settings.configurations[item] = value;
        if (!value)
            delete settings.configurations[item];

        setSettings({ ...settings });

        await Database.updateSettings(settings);
    }

    const openModal = (name) => {
        const data =  { name: name };

        if (data.name == 'Bindings') {
            data.items = bindings.joypad.map(button => new Object({ 
                key: button,
                name: prettify(button, 'RETRO_DEVICE_ID_JOYPAD_'),
                options: bindings.keyboard.map(key => new Object({
                    key: key,
                    name: prettify(key, 'MTY_KEY_')
                })),
            }));
            data.current = settings.bindings;
            data.update = bind;

        } else {
            data.items = options[name].map(option => new Object({ 
                key: option.key,
                name: option.name,
                options: option.options.map(value => new Object({
                    key: value,
                    name: value
                })),
            }));
            data.current = settings.configurations;
            data.update = override;
        }

        setData(data);
        setModal(true);
    }

    const closeModal = () => {
        setData({});
        setModal(false);
    }

	useIonViewWillEnter(async () => {
		setLanguages(await junie_get_languages());
		setBindings(await junie_get_bindings());
		setOptions(await junie_get_settings());
		setSettings(await Database.getSettings());
	});

	return (
		<IonPage>

			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent class="settings">

                <EditModal open={modal} dismiss={closeModal} data={data} />

                <IonList lines="full">

                    <IonItem key="languages">
                        <IonLabel>Language</IonLabel>
                        <IonSelect interface="action-sheet" value={settings.language} onIonChange={e => language(e.detail.value)}>
                            {languages.sort().map(name =>
                                <IonSelectOption key={name} value={name}>{prettify(name, 'RETRO_LANGUAGE_')}</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>

                    <IonItem key="framerate">
                        <IonLabel>Adaptive framerate</IonLabel>
                        <IonCheckbox checked={settings.adaptive_framerate} onIonChange={e => adaptive_framerate(e.detail.checked)} />
                    </IonItem>

                    <IonItem key="bindings" button onClick={() => openModal('Bindings')}>
                        <IonLabel>Bindings</IonLabel>
                    </IonItem>

                    {Object.keys(options).map(name =>
                        <IonItem key={name} button onClick={() => openModal(name)}>
                            <IonLabel>{name}</IonLabel>
                        </IonItem>
                    )}

                </IonList>
			</IonContent>

		</IonPage>
	);
};
