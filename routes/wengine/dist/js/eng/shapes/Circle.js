import { vec2 } from '../math.js';
import Shape from './Shape.js';
export default class Circle extends Shape {
	radius;
	constructor({ location = vec2(0), rotation = 0, scale = vec2(1), radius = 1 } = {}) {
		super({ location, rotation, scale });
		this.radius = radius;
	}
}
