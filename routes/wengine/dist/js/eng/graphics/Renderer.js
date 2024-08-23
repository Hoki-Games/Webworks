const texParamMap = {
	PACK_ALIGNMENT: 'pixelStoreI',
	UNPACK_ALIGNMENT: 'pixelStoreI',
	UNPACK_FLIP_Y_WEBGL: 'pixelStoreI',
	UNPACK_PREMULTIPLY_ALPHA_WEBGL: 'pixelStoreI',
	UNPACK_COLORSPACE_CONVERSION_WEBGL: 'pixelStoreI',
	PACK_ROW_LENGTH: 'pixelStoreI',
	PACK_SKIP_PIXELS: 'pixelStoreI',
	PACK_SKIP_ROWS: 'pixelStoreI',
	UNPACK_ROW_LENGTH: 'pixelStoreI',
	UNPACK_IMAGE_HEIGHT: 'pixelStoreI',
	UNPACK_SKIP_PIXELS: 'pixelStoreI',
	UNPACK_SKIP_ROWS: 'pixelStoreI',
	UNPACK_SKIP_IMAGES: 'pixelStoreI',
	TEXTURE_MAG_FILTER: 'texI',
	TEXTURE_MIN_FILTER: 'texI',
	TEXTURE_WRAP_S: 'texI',
	TEXTURE_WRAP_T: 'texI',
	TEXTURE_BASE_LEVEL: 'texI',
	TEXTURE_COMPARE_FUN: 'texI',
	TEXTURE_COMPARE_MOD: 'texI',
	TEXTURE_MAX_LEVEL: 'texI',
	TEXTURE_WRAP_R: 'texI',
	TEXTURE_MAX_LOD: 'texF',
	TEXTURE_MIN_LOD: 'texF'
};
const matrixDim = {
	'2': 4,
	'2x3': 6,
	'2x4': 8,
	'3x2': 6,
	'3': 9,
	'3x4': 12,
	'4x2': 8,
	'4x3': 12,
	'4': 16
};
export default class Renderer {
	#data;
	scene;
	program;
	shaders;
	constructor({ scene, shaders = [] }) {
		this.scene = scene;
		this.#data = {
			uniforms: {},
			buffers: {},
			attributes: {},
			textures: []
		};
		const gl = scene.gl;
		this.program = gl.createProgram();
		this.shaders = shaders.map((s) => {
			const shader = gl.createShader(WebGL2RenderingContext[s.type]);
			gl.shaderSource(shader, s.source);
			gl.compileShader(shader);
			gl.attachShader(this.program, shader);
			return shader;
		});
		gl.linkProgram(this.program);
	}
	init({ uniforms = {}, attributes = {}, textures = [] } = {}) {
		for (const name in uniforms) {
			const val = uniforms[name];
			if ('dim' in val)
				this.setUniform(name, val.data, val.dim);
			else
				this.setUniform(name, val);
		}
		for (const name in attributes) {
			const attr = attributes[name];
			this.setAttribute(name, attr.data, attr.type, attr.length);
		}
		textures.forEach((v, id) => {
			this.setTexture({
				id,
				img: v.img,
				settings: v.settings
			});
		});
	}
	draw(vertsCount, mode = WebGL2RenderingContext.TRIANGLES) {
		this.scene.gl.useProgram(this.program);
		this.#data.textures.forEach((v, i) => {
			this.scene.gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + i);
			this.scene.gl.bindTexture(v.target, v.location);
		});
		for (const name in this.#data.uniforms) {
			const uni = this.#data.uniforms[name];
			const type = uni.type;
			if (type in matrixDim) {
				const func = (`uniformMatrix${type}fv`);
				this.scene.gl[func](uni.location, false, uni.data);
			}
			else {
				const length = uni.data.length;
				const func = `uniform${length}${type}v`;
				this.scene.gl[func](uni.location, uni.data);
			}
		}
		for (const name in this.#data.attributes) {
			const attr = this.#data.attributes[name];
			this.scene.gl.bindBuffer(this.scene.gl.ARRAY_BUFFER, this.#data.buffers[name]);
			if (attr.type == 'INT') {
				this.scene.gl.vertexAttribIPointer(attr.location, attr.length, WebGL2RenderingContext.INT, 0, 0);
			}
			else {
				this.scene.gl.vertexAttribPointer(attr.location, attr.length, WebGL2RenderingContext[attr.type], false, 0, 0);
			}
			this.scene.gl.enableVertexAttribArray(attr.location);
		}
		this.scene.gl.drawArrays(mode, 0, vertsCount);
	}
	getAttribute(name) {
		return this.#data.attributes[name].data;
	}
	setAttribute(name, value, type, length) {
		if (!(name in this.#data.attributes)) {
			this.#data.attributes[name] = {
				data: value,
				location: this.scene.gl.getAttribLocation(this.program, name),
				type,
				length
			};
			this.#data.buffers[name] = this.scene.gl.createBuffer();
		}
		this.#data.attributes[name].data = value;
		this.updateAttribute(name);
	}
	updateAttribute(name) {
		this.scene.gl.bindBuffer(this.scene.gl.ARRAY_BUFFER, this.#data.buffers[name]);
		this.scene.gl.bufferData(this.scene.gl.ARRAY_BUFFER, this.getAttribute(name), this.scene.gl.STATIC_DRAW);
	}
	getUniform(name) {
		return this.#data.uniforms[name].data;
	}
	setUniform(name, value, matrix) {
		let type;
		if (!matrix) {
			type = (() => {
				switch (value.constructor) {
					case Int32Array:
						return 'i';
					case Uint32Array:
						return 'ui';
					case Float32Array:
						return 'f';
					default:
						throw new Error('Invalid data type');
				}
			})();
			if (value.length < 1 || value.length > 4)
				throw new Error('Array length must be in bounds [1, 4]');
		}
		else {
			type = matrix;
			if (!(value instanceof Float32Array))
				throw new Error('Invalid data type');
			if (value.length != matrixDim[matrix])
				throw new Error(`Array length must be [${matrixDim[matrix]}]`);
		}
		if (!(name in this.#data.uniforms)) {
			this.#data.uniforms[name] = {
				location: this.scene.gl.getUniformLocation(this.program, name),
				data: value,
				type
			};
		}
		this.#data.uniforms[name].data = value;
	}
	getTexture(id) {
		return this.#data.textures[id].data;
	}
	setTexture({ id, img, settings = {} }) {
		const target = settings.target ?? WebGL2RenderingContext.TEXTURE_2D;
		const level = settings.target ?? 0;
		const internalformat = settings.internalformat ?? WebGL2RenderingContext.RGBA;
		// @ts-ignore
		const width = settings.width ?? img.width ?? img.displayWidth;
		// @ts-ignore
		const height = settings.height ?? img.height ?? img.displayHeight;
		const border = settings.border ?? 0;
		const format = settings.format ?? WebGL2RenderingContext.RGBA;
		const type = settings.type ?? WebGL2RenderingContext.UNSIGNED_BYTE;
		const params = {
			pixelStoreI: [],
			texI: [],
			texF: []
		};
		if (settings?.params) {
			for (const name in settings.params) {
				;
				params[texParamMap[name]].push({
					name: WebGL2RenderingContext[name],
					value: settings.params[name]
				});
			}
		}
		const gl = this.scene.gl;
		const texture = gl.createTexture();
		gl.bindTexture(target, texture);
		params.pixelStoreI.forEach((v) => gl.pixelStorei(v.name, v.value));
		gl.texImage2D(target, level, internalformat, width, height, border, format, type, img);
		params.texI.forEach((v) => gl.texParameteri(target, v.name, v.value));
		params.texF.forEach((v) => gl.texParameterf(target, v.name, v.value));
		this.#data.textures[id] = {
			data: img,
			location: texture,
			target
		};
	}
}
