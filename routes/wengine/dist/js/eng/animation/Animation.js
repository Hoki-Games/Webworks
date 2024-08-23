import Blank from './Blank.js';
export default class Animation extends Blank {
	_func = (p) => p;
	_x0;
	_dx;
	constructor({ x0 = 0, dx = 1, percent = 0, func = (p) => p } = {}) {
		super();
		this._func = func;
		this._x0 = x0;
		this._dx = dx;
		this.percent = percent;
	}
	get value() {
		return this._x0 + this._func(this.percent) * this._dx;
	}
}
