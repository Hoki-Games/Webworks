import { Vector2, vec2 } from '../math.js';
import Polygon from './Polygon.js';
const PI2 = Math.PI * 2;
const PI_2 = Math.PI * 0.5;
export default class RegularPolygon extends Polygon {
	constructor({ location = vec2(0), rotation = 0, vertexCount, radius }) {
		const verts = [];
		const delta = PI2 / vertexCount;
		const theta = vertexCount % 2 ? 0 : delta * 0.5;
		const beta = PI_2 - theta;
		for (let i = 0; i < vertexCount; i++) {
			verts.push(Vector2.fromDegree(beta + delta * i, radius));
		}
		super({ location, rotation, scale: vec2(1), vertices: verts });
	}
}
