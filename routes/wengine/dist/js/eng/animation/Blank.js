import { clamp } from '../math.js';
export default class Blank {
	#value;
	#percent;
	constructor(value = 0) {
		this.#value = value;
		this.#percent = 0;
	}
	get percent() {
		return this.#percent;
	}
	set percent(v) {
		this.#percent = clamp(v, 0, 1);
	}
	get value() {
		return this.#value;
	}
}
