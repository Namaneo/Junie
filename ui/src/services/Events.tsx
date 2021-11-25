import { Subject } from 'rxjs'

export module Events {

    type EventCallback<T> = (value: T) => void;

    const subjects: { [subject: string]: Subject<any> } = {}

    export function subscribe<T>(subject: string, callback: EventCallback<T>) {
        if (!subjects[subject])
            subjects[subject] = new Subject();

        subjects[subject].subscribe(callback);
    }

    export function next<T>(subject: string, value: T) {
        if (!subjects[subject])
            subjects[subject] = new Subject();

        subjects[subject].next(value);
    }

}


export default Events;