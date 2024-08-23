import TexPositionedObject from './TexPositionedObject.js';
export default class TextureObject extends TexPositionedObject {
	img;
	constructor({ scene, img, tris, uvmap, zIndex }) {
		super({
			scene,
			shaders: [
				{
					source: `#version 300 es
				precision mediump float;

				uniform vec2 u_origin;
				uniform mat3 u_transform;
				uniform float u_ratio;

				in vec2 i_vertexPosition;
				in vec2 i_uvmap;

				out vec2 v_uvmap;

				vec2 transform(vec2 v) {
					vec3 pos = vec3(v - u_origin, 1);
					pos = u_transform * pos;
					pos += vec3(u_origin, 0);
					if (u_ratio != .0) {
						pos.x /= u_ratio;
					}
					return vec2(pos);
				}

				void main() {
					vec2 pos = transform(i_vertexPosition);
					v_uvmap = i_uvmap;
					gl_Position = vec4(pos, 0, 1);
				}`,
					type: 'VERTEX_SHADER'
				},
				{
					source: `#version 300 es
				precision mediump float;

				uniform sampler2D u_texture;

				in vec2 v_uvmap;

				out vec4 o_fragColor;

				void main() {
					o_fragColor = texture(u_texture, v_uvmap);
				}`,
					type: 'FRAGMENT_SHADER'
				}
			],
			uniforms: {
				u_texture: Int32Array.of(0)
			},
			textures: [
				{
					img: img,
					settings: {
						internalformat: WebGL2RenderingContext.RGBA,
						format: WebGL2RenderingContext.RGBA,
						params: {
							TEXTURE_WRAP_S: WebGL2RenderingContext.MIRRORED_REPEAT,
							TEXTURE_WRAP_T: WebGL2RenderingContext.MIRRORED_REPEAT,
							TEXTURE_MIN_FILTER: WebGL2RenderingContext.LINEAR,
							UNPACK_FLIP_Y_WEBGL: true
						}
					}
				}
			],
			tris,
			uvmap,
			zIndex
		});
		this.img = img;
	}
}
