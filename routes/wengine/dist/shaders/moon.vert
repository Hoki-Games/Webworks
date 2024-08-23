#version 300 es
precision mediump float;

uniform vec2 u_origin;
uniform mat3 u_transform;
uniform float u_ratio;

in vec2 i_vertexPosition;

out vec2 v_fragmentPosition;

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

	gl_Position = vec4(pos, 0, 1);
	v_fragmentPosition = i_vertexPosition * .5 + .5;
	v_fragmentPosition.y = 1. - v_fragmentPosition.y;
}