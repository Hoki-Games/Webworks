import PositionedObject from './PositionedObject.js';
export default class TrianglesObject extends PositionedObject {
	constructor({ scene, uniforms, attributes, textures, shaders, tris, physicsModel, zIndex }) {
		super({
			scene,
			uniforms,
			attributes,
			textures,
			shaders,
			verts: tris.flat(),
			physicsModel,
			zIndex
		});
	}
	getTriangle(id) {
		const arr = new Float32Array(this._verts.buffer, 24 * id, 6);
		return [
			[arr[0], arr[1]],
			[arr[2], arr[3]],
			[arr[4], arr[5]]
		];
	}
	setTriangle(id, triangle) {
		if (id < 0 || id >= this.vertsCount / 2)
			return false;
		this._verts.set(triangle.flat(2), id * 6);
		this.updateTriangles();
		return true;
	}
	addTriangle(triangle) {
		const arr = new Float32Array((this.vertsCount / 2 + 1) * 6);
		arr.set(new Float32Array(this._verts.buffer));
		arr.set(Float32Array.from(triangle.flat(2)), this.vertsCount * 2);
		this._verts = arr;
		this.updateTriangles();
		return this.vertsCount / 2 - 1;
	}
	removeTriangle(id) {
		if (id < 0 || id >= this.vertsCount / 2)
			return false;
		const arr = new Float32Array((this.vertsCount / 2 - 1) * 6);
		arr.set(new Float32Array(this._verts.buffer, 0, id * 6));
		arr.set(new Float32Array(this._verts.buffer, (id + 1) * 24, (this.vertsCount / 2 - 1 - id) * 6), id * 6);
		this._verts = arr;
		this.updateTriangles();
		return true;
	}
	updateTriangles() {
		this.vertsCount = this._verts.byteLength / 8;
		this.renderer.updateAttribute('i_vertexPosition');
	}
}
