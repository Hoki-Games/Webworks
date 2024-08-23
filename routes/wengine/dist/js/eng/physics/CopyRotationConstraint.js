import TargetConstraint from './TargetConstraint.js';
export default class CopyRotationConstraint extends TargetConstraint {
	invert;
	offset;
	ownerRelativity;
	targetRelativity;
	constructor(owner, target, { invert = false, offset = false, ownerRelativity = 'global', targetRelativity = 'global' } = {}) {
		super(owner, target);
		this.invert = invert;
		this.offset = offset;
		this.ownerRelativity = ownerRelativity;
		this.targetRelativity = targetRelativity;
	}
	solve() {
		const i = this.invert ? -1 : 1;
		const o = this.ownerRelativity == 'local'
			? this.owner.local.r
			: this.owner.global.r;
		const t = this.targetRelativity == 'local'
			? this.target.local.r
			: this.target.global.r;
		this.owner.global.rotate(t * i + (this.offset ? o : 0));
	}
}
