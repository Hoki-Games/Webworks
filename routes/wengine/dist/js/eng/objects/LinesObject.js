import { vec2 } from '../math.js';
import OneColorObject from './OneColorObject.js';
export default class LinesObject extends OneColorObject {
	constructor({ scene, lines, width = 0.1, color = '#000', zIndex }) {
		const verts = [];
		for (const line of lines) {
			const v1 = vec2(...line[0]);
			const v2 = vec2(...line[1]);
			const a = v2.dif(v1);
			const b = a.right;
			const c = b.scale(width / b.size);
			verts.push([v2.dif(c).arr, v1.sum(c).arr, v1.dif(c).arr]);
			verts.push([v2.dif(c).arr, v2.sum(c).arr, v1.sum(c).arr]);
		}
		super(scene, color, verts, zIndex);
	}
}
