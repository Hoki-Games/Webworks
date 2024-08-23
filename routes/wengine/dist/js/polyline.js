import { vec2 } from './eng/math.js';
import PositionedObject from './eng/objects/PositionedObject.js';
const ZERO_V = vec2(0);
/**
 * Starts from left vert, ends on right
 */
const polylineSegment = ({ point, normals: [a, b], width: w = 1, miterLimit = 4, lineJoin = 'miter' }) => {
	const n = a.sum(b);
	const l = 2 * w * w / (n.x * n.x + n.y * n.y);
	const v = n.scale(l);
	return (lineJoin == 'miter' && v.size <= miterLimit * w) ? [
		point.dif(v),
		point.sum(v)
	] : [
		point.dif(a),
		point.sum(a),
		point.dif(b),
		point.sum(b)
	];
};
export const polyline = ({ points: p, width = 1, closed = false, miterLimit = 2, lineEnd = 'butt', lineJoin = 'miter' }) => {
	if (p.length == 0)
		return [];
	if (p.length == 1)
		throw new Error('At least 2 points are required to calculate polyline');
	const ret = [];
	// First is between last and first verts
	const n = p.map((v, i) => {
		let n = v.dif(p.at(i - 1));
		n = n.scale(width / n.size);
		return [n.right, n];
	});
	const lE = lineEnd == 'square';
	const first = closed ? polylineSegment({
		point: p[0],
		normals: [n[0][0], n[1][0]],
		width,
		lineJoin,
		miterLimit
	}) : [
		p[0].dif(n[1][0]).dif(lE ? n[1][1] : ZERO_V),
		p[0].sum(n[1][0]).dif(lE ? n[1][1] : ZERO_V)
	];
	ret.push(...first);
	for (let i = 2; i < p.length; i++)
		ret.push(...polylineSegment({
			point: p[i - 1],
			normals: [n[i - 1][0], n[i][0]],
			width,
			lineJoin,
			miterLimit
		}));
	const lastP = p.at(-1);
	const lastN = n.at(-1);
	if (closed)
		ret.push(...polylineSegment({
			point: lastP,
			normals: [lastN[0], n[0][0]],
			width,
			lineJoin,
			miterLimit
		}), ...first);
	else
		ret.push(lastP.dif(lastN[0]).sum(lE ? lastN[1] : ZERO_V), lastP.sum(lastN[0]).sum(lE ? lastN[1] : ZERO_V));
	return ret;
};
export default class PolylineObject extends PositionedObject {
	#points;
	#width;
	#closed;
	#miterLimit;
	#lineEnd;
	#lineJoin;
	constructor({ scene, uniforms, attributes, textures, shaders, points = [], width = 1, closed = false, miterLimit = 4, lineEnd = 'butt', lineJoin = 'miter', zIndex }) {
		super({
			scene,
			uniforms,
			attributes,
			textures,
			shaders,
			verts: [],
			drawMode: WebGL2RenderingContext.TRIANGLE_STRIP,
			zIndex
		});
		this.#width = width;
		this.#closed = closed;
		this.#miterLimit = miterLimit;
		this.#lineEnd = lineEnd;
		this.#lineJoin = lineJoin;
		this.setPoints(points);
	}
	setPoints(points) {
		this.#points = points.map(([x, y]) => vec2(x, y));
		this.updatePolyline();
	}
	updatePolyline() {
		const poly = polyline({
			points: this.#points,
			width: this.#width,
			closed: this.#closed,
			miterLimit: this.#miterLimit,
			lineEnd: this.#lineEnd,
			lineJoin: this.#lineJoin
		});
		this._verts = Float32Array.from(poly.flatMap(v => v.arr));
		this.setAttribute('i_vertexPosition', this._verts, 'FLOAT', 2);
		this.vertsCount = poly.length;
	}
	get closed() {
		return this.#closed;
	}
	set closed(v) {
		this.#closed = v;
		this.updatePolyline();
	}
	get lineEnd() {
		return this.#lineEnd;
	}
	set lineEnd(v) {
		this.#lineEnd = v;
		this.updatePolyline();
	}
	get lineJoin() {
		return this.#lineJoin;
	}
	set lineJoin(v) {
		this.#lineJoin = v;
		this.updatePolyline();
	}
	get miterLimit() {
		return this.#miterLimit;
	}
	set miterLimit(v) {
		this.#miterLimit = v;
		this.updatePolyline();
	}
	get width() {
		return this.#width;
	}
	set width(v) {
		this.#width = v;
		this.updatePolyline();
	}
}
