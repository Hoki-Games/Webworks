#version 300 es
precision mediump float;

uniform sampler2D u_texture;

uniform uint u_gridSize;
uniform float u_grad;

in vec2 v_fragmentPosition;

out vec4 o_fragColor;

void main() {
	float gridSize = float(u_gridSize);
	vec2 p = v_fragmentPosition;

	o_fragColor = texture(u_texture, p);

	vec2 pr = (floor(p * gridSize) + .5) / gridSize;

	float c = (pr.x + pr.y) * .5;
	float k = clamp(1. - (abs(c - u_grad) - .03) * 7., 0., 1.);

	float r = k / gridSize * .5;

	if (c > u_grad) o_fragColor.a = 0.;

	if (abs(p.x - pr.x) < r && abs(p.y - pr.y) < r)
		o_fragColor = texture(u_texture, pr);
}