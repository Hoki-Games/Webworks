import { vec2 } from '../math.js';
import Shape from './Shape.js';
export default class Polygon extends Shape {
	vertices;
	constructor({ location = vec2(0), rotation = 0, scale = vec2(1), vertices }) {
		super({ location, rotation, scale });
		if (vertices.length < 3)
			throw new Error('Polygon must have at least 3 vertices', {
				cause: vertices
			});
		this.vertices = vertices;
	}
}
