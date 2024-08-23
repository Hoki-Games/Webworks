import { vec2 } from '../math.js';
import Polygon from './Polygon.js';
export default class Rectangle extends Polygon {
	constructor({ location = vec2(0), rotation = 0, scale = vec2(1), height, width }) {
		super({
			location,
			rotation,
			scale,
			vertices: [
				vec2(width * 0.5, height * 0.5),
				vec2(width * -0.5, height * 0.5),
				vec2(width * 0.5, height * -0.5),
				vec2(width * -0.5, height * -0.5)
			]
		});
	}
}
