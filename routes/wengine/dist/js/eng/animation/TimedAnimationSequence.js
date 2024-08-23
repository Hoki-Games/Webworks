import AnimationSequence from './AnimationSequence.js';
export default class TimedAnimationSequence extends AnimationSequence {
	t0;
	dur;
	constructor({ t0 = 0, dur = 1, offset = 0, animations = [] } = {}) {
		super(offset, ...animations);
		this.t0 = t0;
		this.dur = dur;
	}
	update(time) {
		this.percent = (time - this.t0) / this.dur;
		return this.value;
	}
}
