import TargetConstraint from './TargetConstraint.js';
export default class Spring extends TargetConstraint {
	L0;
	ks;
	constructor(owner, target, { L0, ks }) {
		super(owner, target);
		this.L0 = L0;
		this.ks = ks;
	}
	solve() {
		const diff = this.owner.global.t.dif(this.target.global.t);
		const dl = diff.size;
		const x = dl - this.L0;
		const f = this.ks * x;
		const F_ba = diff.scale(f / (dl || Infinity));
		const F_ab = F_ba.neg;
		this.owner.applyForce(F_ab);
		this.target.applyForce(F_ba);
	}
}
