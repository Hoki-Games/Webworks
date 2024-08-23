import { clamp } from '../math.js';
import Animation from './Animation.js';
export default class AnimationSequence extends Animation {
	#sequence;
	offset;
	constructor(arg1, ...arg2) {
		super();
		this.#sequence = [];
		if (typeof arg1 == 'number') {
			this.offset = arg1;
			arg2.forEach((v) => this.add(v.anim, v.dur));
		}
		else {
			this.offset = 0;
			[arg1, ...arg2].forEach((v) => this.add(v.anim, v.dur));
		}
	}
	add(anim, dur = 1) {
		this.#sequence.push({
			anim,
			s: this.length,
			dur
		});
	}
	remove(p) {
		p = clamp(p, 0, 1) * this.length;
		const id = this.#sequence.findIndex((v) => v.s <= p && v.s + v.dur >= p);
		this.#sequence.splice(id, 1);
		for (let i = id; i < this.#sequence.length; i++) {
			const anim = this.#sequence[i];
			if (i == 0) {
				anim.s = 0;
				continue;
			}
			const last = this.#sequence[i - 1];
			anim.s = last.s + last.dur;
		}
	}
	get length() {
		return this.#sequence.reduce((t, v) => t + v.dur, 0);
	}
	get value() {
		const p = this.percent * this.length;
		const anim = this.#sequence.find((v) => v.s <= p && v.s + v.dur >= p);
		anim.anim.percent = (p - anim.s) / anim.dur;
		return this.offset + anim.anim.value;
	}
}
