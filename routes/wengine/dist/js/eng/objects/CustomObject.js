import Renderer from '../graphics/Renderer.js';
export default class CustomObject {
	#drawMode;
	renderer;
	zIndex;
	vertsCount;
	constructor({ scene, uniforms = {}, attributes = {}, textures = [], shaders, vertsCount, drawMode = WebGL2RenderingContext.TRIANGLES, zIndex = 0 }) {
		this.vertsCount = vertsCount;
		this.#drawMode = drawMode;
		this.zIndex = zIndex;
		this.renderer = new Renderer({ scene, shaders });
		this.renderer.init({ uniforms, attributes, textures });
	}
	draw() {
		this.renderer.draw(this.vertsCount, this.#drawMode);
	}
	getAttribute(name) {
		return this.renderer.getAttribute(name);
	}
	setAttribute(name, value, type, length) {
		this.renderer.setAttribute(name, value, type, length);
	}
	getUniform(name) {
		return this.renderer.getUniform(name);
	}
	setUniform(name, value, matrix) {
		this.renderer.setUniform(name, value, matrix);
	}
	getTexture(id) {
		return this.renderer.getTexture(id);
	}
	setTexture(id, img, settings) {
		this.renderer.setTexture({ id, img, settings });
	}
}
