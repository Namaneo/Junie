import { Variable } from ' { Variable } ';

export class Settings {
    /** @type {Variable[]} */
    get variables() {
        return Object.keys(this).map(key => ({ key, value: this[key] }));
    }

    /**
     * @param {any} obj 
     */
    constructor(obj) {
        if (!obj) return;

        for (const key of Object.keys(obj))
            this[key] = obj[key];
    }
}
