import { vec2 } from '../math.js';
import TransformMatrix3 from '../math/TransformMatrix3.js';
export default class PhysicsModel {
	#origin;
	#local;
	#global;
	velocity; // m/s
	acceleration; // m/s²
	force; // N (kg∙m/s²)
	mass; // kg
	constructor({ location = vec2(0), rotation = 0, scale = vec2(1), skew = 0, mass = 1, velocity = vec2(0), acceleration = vec2(0), origin = vec2(0) } = {}) {
		this.#origin = Float32Array.from(origin);
		this.mass = mass;
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.force = vec2(0);
		this.#local = new TransformMatrix3({
			translate: location,
			rotate: rotation,
			scale,
			skew
		});
		this.#global = this.#local.copy();
		this.updateLocation(0);
	}
	applyForce(force) {
		this.force.add(force);
	}
	applyAcceleration(acceleration) {
		this.acceleration.add(acceleration);
	}
	applyVelocity(velocity) {
		this.velocity.add(velocity);
	}
	move(displacement) {
		const [tx, ty] = this.#local.t.sum(displacement);
		this.#local.translate(tx, ty);
	}
	updateLocation(dt) {
		this.applyAcceleration(this.force.scale(1 / this.mass));
		this.applyVelocity(this.acceleration.scale(dt));
		this.move(this.velocity.scale(dt));
		this.acceleration = vec2(0);
		this.force = vec2(0);
		this.#global.copyFields(this.#local);
	}
	get origin() {
		return this.#origin;
	}
	get local() {
		return this.#local;
	}
	get global() {
		return this.#global;
	}
}
