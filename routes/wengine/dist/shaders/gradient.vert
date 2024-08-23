#version 300 es
precision mediump float;

uniform float u_ratio;
uniform float u_zoom;

in vec2 i_vertexPosition;

out vec2 v_fragmentPosition;

void main() {
	gl_Position = vec4(i_vertexPosition, 0, 1);

	vec2 pos = i_vertexPosition;

	if (u_ratio != .0) {
		pos.x *= u_ratio;
	}

	v_fragmentPosition = pos * u_zoom * .5 + .5;
	v_fragmentPosition.y = 1. - v_fragmentPosition.y;
}