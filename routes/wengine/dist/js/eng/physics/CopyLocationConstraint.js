import TargetConstraint from './TargetConstraint.js';
export default class CopyLocationConstraint extends TargetConstraint {
	axes;
	invert;
	offset;
	ownerRelativity;
	targetRelativity;
	constructor(owner, target, { axes = [true, true], invert = [false, false], offset = false, ownerRelativity = 'global', targetRelativity = 'global' } = {}) {
		super(owner, target);
		this.axes = axes;
		this.invert = invert;
		this.offset = offset;
		this.ownerRelativity = ownerRelativity;
		this.targetRelativity = targetRelativity;
	}
	solve() {
		const o = this.ownerRelativity == 'local'
			? this.owner.local.t
			: this.owner.global.t;
		const t = this.targetRelativity == 'local'
			? this.target.local.t
			: this.target.global.t;
		if (this.axes[0]) {
			const i = this.invert[0] ? -1 : 1;
			this.owner.global.translateX(t.x * i + (this.offset ? o.x : 0));
		}
		if (this.axes[1]) {
			const i = this.invert[1] ? -1 : 1;
			this.owner.global.translateY(t.y * i + (this.offset ? o.y : 0));
		}
	}
}
