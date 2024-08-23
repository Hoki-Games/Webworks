import TargetConstraint from './TargetConstraint.js';
export default class LimitDistanceConstraint extends TargetConstraint {
	distance;
	clampRegion;
	ownerRelativity;
	targetRelativity;
	constructor(owner, target, { distance = 0, clampRegion = 'inside', ownerRelativity = 'global', targetRelativity = 'global' } = {}) {
		super(owner, target);
		this.distance = distance;
		this.clampRegion = clampRegion;
		this.ownerRelativity = ownerRelativity;
		this.targetRelativity = targetRelativity;
	}
	solve() {
		const og = this.owner.global;
		const o = this.ownerRelativity == 'local' ? this.owner.local : og;
		const t = this.targetRelativity == 'local'
			? this.target.local
			: this.target.global;
		const dir = t.t.dif(o.t);
		const dist = dir.size;
		const diff = dist - this.distance;
		if ((this.clampRegion == 'inside' && diff > 0) ||
			(this.clampRegion == 'outside' && diff < 0) ||
			(this.clampRegion == 'surface' && diff !== 0)) {
			const t = dir.scale(diff / dist).sum(og.t);
			og.translate(t.x ?? 0, t.y ?? 0);
		}
	}
}
