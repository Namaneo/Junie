import { Subject } from 'rxjs'

const subjects = {}

export function subscribe(subject, callback) {
	if (!subjects[subject])
		subjects[subject] = new Subject();

	subjects[subject].subscribe(callback);
}

export function next(subject, value) {
	if (!subjects[subject])
		subjects[subject] = new Subject();

	subjects[subject].next(value);
}
