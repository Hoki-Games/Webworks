import ObjectConstraint from './ObjectConstraint.js';
export default class TargetConstraint extends ObjectConstraint {
	target;
	constructor(owner, target) {
		super(owner);
		this.target = target;
	}
}
