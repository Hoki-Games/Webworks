import TrianglesObject from './TrianglesObject.js';
export default class TexPositionedObject extends TrianglesObject {
	_uvmap;
	constructor({ scene, uniforms, attributes, textures, shaders, tris, uvmap, zIndex }) {
		super({
			scene,
			uniforms,
			attributes,
			textures,
			shaders,
			tris,
			zIndex
		});
		this._uvmap = Float32Array.from(uvmap.flat(2));
		this.setAttribute('i_uvmap', this._uvmap.buffer, 'FLOAT', 2);
		this.updateUVTriangles();
	}
	getUVTriangle(id) {
		const arr = new Float32Array(this._uvmap.buffer, 24 * id, 6);
		return [
			[arr[0], arr[1]],
			[arr[2], arr[3]],
			[arr[4], arr[5]]
		];
	}
	setUVTriangle(id, triangle) {
		if (id < 0 || id >= this._uvmap.byteLength / 24)
			return false;
		this._uvmap.set(triangle.flat(2), id * 6);
		this.updateUVTriangles();
		return true;
	}
	addUVTriangle(triangle) {
		const arr = new Float32Array((this._uvmap.byteLength / 24 + 1) * 6);
		arr.set(new Float32Array(this._uvmap.buffer));
		arr.set(Float32Array.from(triangle.flat(2)), this._uvmap.byteLength / 4);
		this._uvmap = arr;
		this.updateUVTriangles();
		return this._uvmap.byteLength / 24 - 1;
	}
	removeUVTriangle(id) {
		if (id < 0 || id >= this._uvmap.byteLength / 24)
			return false;
		const arr = new Float32Array((this._uvmap.byteLength / 24 - 1) * 6);
		arr.set(new Float32Array(this._uvmap.buffer, 0, id * 6));
		arr.set(new Float32Array(this._uvmap.buffer, (id + 1) * 24, (this._uvmap.byteLength / 24 - 1 - id) * 6), id * 6);
		this._uvmap = arr;
		this.updateUVTriangles();
		return true;
	}
	updateUVTriangles() {
		this.renderer.updateAttribute('i_uvmap');
	}
}
