/* eslint-disable no-mixed-spaces-and-tabs */
import { Vector2, Matrix3, vec2 } from '../math.js';
export default class TransformMatrix3 extends Matrix3 {
	#translate;
	#angle;
	#direct;
	#skew;
	#scale;
	constructor(value = {}) {
		super();
		if (value instanceof Float32Array) {
			this.setArray(value);
		}
		else {
			this.#translate = value.translate ?? vec2(0);
			this.#angle = value.rotate ?? 0;
			this.#direct = Vector2.fromDegree(value.rotate ?? 0);
			this.#skew = Math.tan(value.skew) ?? 0;
			this.#scale = value.scale ?? vec2(1);
			this.calcMatrix();
		}
	}
	calcMatrix() {
		const [tx, ty] = this.#translate;
		const [rx, ry] = this.#direct;
		const [sx, sy] = this.#scale;
		const k = this.#skew;
		this._data.set([
			rx * sx,
			ry * sx,
			0,
			(rx * k - ry) * sy,
			(ry * k + rx) * sy,
			0,
			tx,
			ty,
			1
		]);
		return this;
	}
	calcFields() {
		const [m11, m12, , m21, m22, , m31, m32] = this._data;
		this.#direct = vec2(m11, m12).norm;
		this.#angle = this.#direct.rotation;
		const sk = Math.atan2(m22, m21) - Math.PI / 2 - this.#direct.rotation;
		this.#skew = -Math.tan(sk);
		this.#scale = vec2(Math.sqrt(m11 ** 2 + m12 ** 2), Math.sqrt(m21 ** 2 + m22 ** 2) * Math.cos(sk));
		this.#translate = vec2(m31, m32);
		return this;
	}
	translateX(x, recalc = true) {
		this.#translate.x = x;
		if (recalc)
			this.calcMatrix();
		return this;
	}
	translateY(y, recalc = true) {
		this.#translate.y = y;
		if (recalc)
			this.calcMatrix();
		return this;
	}
	translate(x, y, recalc = true) {
		this.#translate = vec2(x, y);
		if (recalc)
			this.calcMatrix();
		return this;
	}
	rotate(v0, v1 = true, v2 = true) {
		if (typeof v1 == 'number') {
			this.#direct = vec2(v0, v1).norm;
			this.#angle = this.#direct.rotation;
			if (v2)
				this.calcMatrix();
		}
		else {
			this.#angle = v0;
			this.#direct = Vector2.fromDegree(v0);
			if (v1)
				this.calcMatrix();
		}
		return this;
	}
	scaleX(sx, recalc = true) {
		this.#scale.x = sx;
		if (recalc)
			this.calcMatrix();
		return this;
	}
	scaleY(sy, recalc = true) {
		this.#scale.y = sy;
		if (recalc)
			this.calcMatrix();
		return this;
	}
	scale(sx, sy, recalc = true) {
		this.#scale = vec2(sx, sy);
		if (recalc)
			this.calcMatrix();
		return this;
	}
	skew(k, recalc = true) {
		this.#skew = Math.tan(k);
		if (recalc)
			this.calcMatrix();
		return this;
	}
	matrix(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
		this.setArray([a, b, 0, c, d, 0, e, f, 1]);
	}
	copy() {
		return new TransformMatrix3(this._data);
	}
	copyFields(value) {
		this.#translate = value.#translate;
		this.#angle = value.#angle;
		this.#direct = value.#direct;
		this.#skew = value.#skew;
		this.#scale = value.#scale;
		this.calcMatrix();
	}
	setArray(value, offset) {
		this._data.set(value, offset);
		this.calcFields();
	}
	get tx() {
		return this.#translate.x;
	}
	get ty() {
		return this.#translate.y;
	}
	get t() {
		return this.#translate.sum();
	}
	get r() {
		return this.#direct.rotation;
	}
	get rd() {
		return this.#angle;
	}
	get sx() {
		return this.#scale.x;
	}
	get sy() {
		return this.#scale.y;
	}
	get s() {
		return this.#scale.sum();
	}
	get k() {
		return Math.atan(this.#skew);
	}
	get kt() {
		return this.#skew;
	}
	get m() {
		const [a, b, , c, d, , e, f] = this._data;
		return [a, b, c, d, e, f];
	}
	get a() {
		return this._data[0];
	}
	set a(v) {
		this._data[0] = v;
		this.calcFields();
	}
	get b() {
		return this._data[1];
	}
	set b(v) {
		this._data[1] = v;
		this.calcFields();
	}
	get c() {
		return this._data[3];
	}
	set c(v) {
		this._data[3] = v;
		this.calcFields();
	}
	get d() {
		return this._data[4];
	}
	set d(v) {
		this._data[4] = v;
		this.calcFields();
	}
	get e() {
		return this._data[6];
	}
	set e(v) {
		this._data[6] = v;
		this.calcFields();
	}
	get f() {
		return this._data[7];
	}
	set f(v) {
		this._data[7] = v;
		this.calcFields();
	}
}
