const resizeCallbacks = new Map();
const resizeObserver = new ResizeObserver(entries => {
	for (const e of entries) {
		let w;
		let h;
		let dpr = devicePixelRatio;
		if (e.devicePixelContentBoxSize) {
			w = e.devicePixelContentBoxSize[0].inlineSize;
			h = e.devicePixelContentBoxSize[0].blockSize;
			dpr = 1;
		}
		else if (e.contentBoxSize) {
			w = e.contentBoxSize[0].inlineSize;
			h = e.contentBoxSize[0].blockSize;
		}
		else {
			w = e.contentRect.width;
			h = e.contentRect.height;
		}
		const cw = Math.round(w * dpr);
		const ch = Math.round(h * dpr);
		resizeCallbacks.get(e.target)?.(cw, ch);
	}
});
export default Object.defineProperties({}, {
	callbacks: {
		value: resizeCallbacks,
		writable: false,
		configurable: false
	},
	observer: {
		value: resizeObserver,
		writable: false,
		configurable: false
	},
	set: {
		value: (target, callback) => {
			resizeCallbacks.set(target, callback);
			resizeObserver.observe(target);
		},
		writable: false,
		configurable: false
	},
	delete: {
		value: (target) => {
			resizeObserver.unobserve(target);
			resizeCallbacks.delete(target);
		},
		writable: false,
		configurable: false
	}
});
