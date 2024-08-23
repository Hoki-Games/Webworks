import Vector2 from './math/Vector2.js';
export { default as Vector2 } from './math/Vector2.js';
export { default as Matrix3 } from './math/Matrix3.js';
export { default as TransformMatrix3 } from './math/TransformMatrix3.js';
/**
 * Simplifies {@link Vector2} creation.
 */
export const vec2 = (x, y) => new Vector2(x, y ?? x);
export const bezier = (x1, y1, x2, y2) => {
	if (x1 < 0 || x1 > 1)
		throw new Error('x1 is out of bounds', { cause: x1 });
	if (x2 < 0 || x2 > 1)
		throw new Error('x2 is out of bounds', { cause: x2 });
	const arr = [];
	const pos = (a, b, t) => t * (3 * a * (1 - t) ** 2 + t * (3 * b * (1 - t) + t));
	return (steps) => {
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			arr.push([pos(x1, x2, t), pos(y1, y2, t)]);
		}
		return (x) => {
			if (x < 0 || x > 1)
				throw new Error('x is out of bounds', { cause: x });
			const search = (l, r) => {
				if (r - l == 1) {
					const rX = arr[r][0];
					const lX = arr[l][0];
					const rY = arr[r][1];
					const lY = arr[l][1];
					return (((x - rX) / (lX - rX)) * lY +
						((x - lX) / (rX - lX)) * rY);
				}
				const i = Math.round(l + (r - l) / 2);
				const v = arr[i];
				if (v[0] < x)
					return search(i, r);
				else if (v[0] > x)
					return search(l, i);
				return v[1];
			};
			return search(0, arr.length - 1);
		};
	};
};
export const clamp = (value, min, max) => Math.min(Math.max(min, value), max);
