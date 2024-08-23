import { vec2 } from '../math.js';
export default class Shape {
	location;
	rotation;
	scale;
	constructor({ location: position = vec2(0), rotation = 0, scale = vec2(1) } = {}) {
		this.location = position;
		this.rotation = rotation;
		this.scale = scale;
	}
}
