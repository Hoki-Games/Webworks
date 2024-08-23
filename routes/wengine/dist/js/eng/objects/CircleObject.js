import { narrowColor } from '../graphics.js';
import { vec2 } from '../math.js';
import PhysicsModel from '../physics/PhysicsModel.js';
import TrianglesObject from './TrianglesObject.js';
export default class CircleObject extends TrianglesObject {
	color;
	constructor({ scene, innerR = 0, location, scale = 1, color = '#000', zIndex }) {
		const clr = Float32Array.from(narrowColor(color));
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
					v_uvmap = i_uvmap;
					vec2 pos = transform(i_vertexPosition);
					gl_Position = vec4(pos, 0, 1);
				}`,
					type: 'VERTEX_SHADER'
				},
				{
					source: `#version 300 es
				precision mediump float;

				uniform float u_innerRadius;
				uniform vec4 u_color;

				in vec2 v_uvmap;

				out vec4 o_fragColor;

				void main() {
					o_fragColor = u_color;
					float kat1 = pow(v_uvmap.x, 2.);
					float kat2 = pow(v_uvmap.y, 2.);
					float dist = sqrt(kat1 + kat2);
					if (dist > 1. || dist < u_innerRadius) o_fragColor.a = 0.;
				}`,
					type: 'FRAGMENT_SHADER'
				}
			],
			uniforms: {
				u_innerRadius: Float32Array.of(innerR),
				u_color: clr
			},
			attributes: {
				i_uvmap: {
					data: Float32Array.of(1, 1, -1, -1, -1, 1, 1, 1, 1, -1, -1, -1),
					length: 2,
					type: 'FLOAT'
				}
			},
			tris: [
				[
					[1, 1],
					[-1, -1],
					[-1, 1]
				],
				[
					[1, 1],
					[1, -1],
					[-1, -1]
				]
			],
			physicsModel: new PhysicsModel({
				location: vec2(...location),
				scale: vec2(scale)
			}),
			zIndex
		});
		this.color = clr;
	}
}
