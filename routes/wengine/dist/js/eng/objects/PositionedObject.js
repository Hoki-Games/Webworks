import PhysicsModel from '../physics/PhysicsModel.js';
import CustomObject from './CustomObject.js';
export default class PositionedObject extends CustomObject {
	#physics;
	#ratio;
	_verts;
	constructor({ scene, uniforms, attributes, textures, shaders, verts, physicsModel = new PhysicsModel(), drawMode = WebGL2RenderingContext.TRIANGLES, zIndex }) {
		super({
			scene,
			uniforms,
			attributes,
			textures,
			shaders,
			vertsCount: verts.length,
			drawMode,
			zIndex,
		});
		this._verts = Float32Array.from(verts.flat());
		this.physics = physicsModel;
		this.ratio = 1;
		this.setAttribute('i_vertexPosition', this._verts.buffer, 'FLOAT', 2);
		this.setUniform('u_origin', this.#physics.origin);
	}
	get physics() {
		return this.#physics;
	}
	set physics(v) {
		this.#physics = v;
		this.setUniform('u_transform', new Float32Array(v.global.buffer), '3');
	}
	get ratio() {
		return this.#ratio;
	}
	set ratio(v) {
		this.#ratio = v;
		this.setUniform('u_ratio', Float32Array.of(v));
	}
}
