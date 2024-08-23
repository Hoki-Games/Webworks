import TargetConstraint from './TargetConstraint.js';
export default class Rope extends TargetConstraint {
	length;
	bounce;
	constructor(owner, target, { length, bounce }) {
		super(owner, target);
		this.length = length;
		this.bounce = bounce;
	}
	solve() {
		const dir = this.target.global.t.dif(this.owner.global.t);
		const diff = dir.size;
		if (diff > this.length) {
			const sum = this.owner.mass + this.target.mass;
			let r1;
			let r2;
			if (Number.isFinite(this.owner.mass)) {
				if (Number.isFinite(this.target.mass)) {
					r1 = this.target.mass / sum;
					r2 = this.owner.mass / sum;
				}
				else {
					r1 = 1;
					r2 = 0;
				}
			}
			else {
				if (Number.isFinite(this.target.mass)) {
					r1 = 0;
					r2 = 1;
				}
				else {
					r1 = 0;
					r2 = 0;
				}
			}
			const mv = dir.scale((diff - this.length) / diff);
			const m1 = mv.scale(r1);
			const m2 = mv.scale(-r2);
			this.owner.move(m1);
			this.target.move(m2);
			this.owner.applyAcceleration(m1.scale(this.bounce));
			this.target.applyAcceleration(m2.scale(this.bounce));
		}
	}
}
