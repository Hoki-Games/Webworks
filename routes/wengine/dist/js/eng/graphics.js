export { default as Renderer } from './graphics/Renderer.js';
export { default as Scene } from './graphics/Scene.js';
export const narrowColor = (color) => {
	let ret;
	if (Array.isArray(color))
		ret = [...color];
	else if (typeof color == 'object')
		ret = [color.r, color.g, color.b, color.a];
	else {
		const b4 = '([0-Fa-f])'.repeat(4);
		const b8 = '([0-Fa-f][0-Fa-f])'.repeat(4);
		const rgba4 = new RegExp(`^#${b4}?$`).exec(color);
		const rgba8 = new RegExp(`^#${b8}?$`).exec(color);
		if (rgba4)
			ret = (rgba4.slice(1).map((v) => parseInt(v, 16) / 15));
		else if (rgba8)
			ret = (rgba8.slice(1).map((v) => parseInt(v, 16) / 255));
		else
			throw new Error('Invalid color data', { cause: color });
	}
	if (Number.isNaN(ret[3]))
		ret[3] = 1;
	return ret;
};
export const narrowDimension = (color) => Array.isArray(color)
	? [...color]
	: [color.x, color.y, color.width, color.height];
