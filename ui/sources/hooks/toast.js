import { useIonToast } from '@ionic/react';
import { checkmarkSharp } from 'ionicons/icons';
import { useState } from 'react';

export const useToast = (header) => {

	const [queue, setQueue] = useState([]);

	const [present, dismiss] = useIonToast();

	const presentNext = () => {
		if (!queue.length)
			return;

		setTimeout(() => present({
			header: header,
			message: queue[0],
			duration: 5000,
			position: 'top',
			color: 'medium',
			buttons: [{ icon: checkmarkSharp, role: 'cancel' }],
			onDidDismiss: () => {
				queue.shift();
				setQueue(queue);

				presentNext();
			}
		}));
	}

	const newPresent = (message) => {
		queue.push(message);
		setQueue(queue);

		if (queue.length == 1)
			presentNext();
	}

	return [newPresent, dismiss];
}
