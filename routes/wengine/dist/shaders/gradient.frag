#version 300 es
precision mediump float;

uniform sampler2D u_texture;

uniform float u_grad;
uniform float u_opacity;
uniform float u_ratio;
uniform float u_zoom;

in vec2 v_fragmentPosition;

out vec4 o_fragColor;

void main() {
	vec2 p = v_fragmentPosition;

	float ratio = u_ratio;
	if (ratio < 1.) ratio = 1. / ratio;

	vec4 texColor = texture(u_texture, p);

	float c = 1. - (p.x + p.y) * .5;
	float k = clamp(c + u_grad * ratio, 0., 1.);

	vec3 gradColor = vec3(.11, .102, .125);

	vec3 dif = texColor.rgb - gradColor;

	if (u_zoom > 1.) {
		k = 1.;
	}

	o_fragColor = vec4(gradColor + dif * u_opacity * texColor.a, k);
}