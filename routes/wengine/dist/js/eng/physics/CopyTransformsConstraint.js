import TargetConstraint from './TargetConstraint.js';
export default class CopyTransformsConstraint extends TargetConstraint {
	mixMode;
	ownerRelativity;
	targetRelativity;
	constructor(owner, target, { mixMode = 'replace', ownerRelativity = 'global', targetRelativity = 'global' } = {}) {
		super(owner, target);
		this.mixMode = mixMode;
		this.ownerRelativity = ownerRelativity;
		this.targetRelativity = targetRelativity;
	}
	solve() {
		const og = this.owner.global;
		const o = this.ownerRelativity == 'local' ? this.owner.local : og;
		const t = this.targetRelativity == 'local'
			? this.target.local
			: this.target.global;
		switch (this.mixMode) {
			case 'replace':
				og.setArray(new Float32Array(t.buffer));
				break;
			case 'split':
				og.scale(t.sx * o.sx, t.sy * o.sy, false);
				og.skew(t.k + o.k, false);
				og.rotate(t.r + o.r, false);
				og.translate(t.tx + o.tx, t.ty + o.ty);
				break;
			case 'beforeFull':
				og.setArray(new Float32Array(t.mult(o).buffer));
				break;
			case 'afterFull':
				og.setArray(new Float32Array(o.mult(t).buffer));
				break;
			default:
				throw new Error('Invalid mix mode', { cause: this.mixMode });
		}
	}
}
