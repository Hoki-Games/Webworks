import Animation from './Animation.js';
export default class TimedAnimation extends Animation {
	t0;
	dur;
	constructor({ x0 = 0, dx = 1, func = (t) => t, t0 = 0, dur = 1 }) {
		super({ dx, x0, func });
		this.t0 = t0;
		this.dur = dur;
	}
	update(time) {
		this.percent = (time - this.t0) / this.dur;
		return this.value;
	}
}
