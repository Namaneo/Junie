import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonModal, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import * as Cores from '../services/cores';
import * as Database from '../services/database';

const EditModal = ({ open, dismiss, data }) => {

    return (
        <IonModal isOpen={open} backdropDismiss={false}>
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
	const [options, setOptions] = useState({});

    const override = async (item, value) => {
        settings[item] = value;
        if (!value)
            delete settings[item];

        await Database.updateSettings(settings);

        setSettings({ ...settings });
	}

    const openModal = (name) => {
        const data =  { name: name };

        data.items = options[name].map(option => new Object({
			key: option.key,
			name: option.name,
			options: option.options.map(value => new Object({
				key: value,
				name: value
			})),
		}));
		data.current = settings;
		data.update = override;

        setData(data);
        setModal(true);
    }

    const closeModal = () => {
        setData({});
        setModal(false);
    }

	useIonViewWillEnter(async () => {
		setOptions({ ...options, ...await Cores.getSettings() });
		setSettings({ ...settings, ...await Database.getSettings() });
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

                    {Object.keys(options).map(name =>
                        <IonItem key={name} button onClick={() => openModal(name)}>
                            <IonLabel>{name}</IonLabel>
                        </IonItem>
                    )}

					<IonItem key="version" class="version">
                        <IonLabel>{window.junie_build}</IonLabel>
                    </IonItem>

                </IonList>
			</IonContent>

		</IonPage>
	);
};
