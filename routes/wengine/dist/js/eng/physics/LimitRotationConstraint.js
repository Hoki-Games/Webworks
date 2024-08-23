import { clamp } from '../math.js';
import ObjectConstraint from './ObjectConstraint.js';
export default class LimitRotationConstraint extends ObjectConstraint {
	#influence;
	min;
	max;
	ownerRelativity;
	constructor(owner, { ownerRelativity = 'global', influence = 1, min = -Infinity, max = Infinity } = {}) {
		super(owner);
		this.ownerRelativity = ownerRelativity;
		this.#influence = influence;
		this.min = min;
		this.max = max;
	}
	solve() {
		const og = this.owner.global;
		const o = this.ownerRelativity == 'local' ? this.owner.local : og;
		const dr = clamp(o.rd, this.min, this.max) - o.rd;
		og.rotate(o.rd + dr * this.#influence);
	}
	get influence() {
		return this.#influence;
	}
	set influence(v) {
		this.#influence = clamp(v, 0, 1);
	}
}
