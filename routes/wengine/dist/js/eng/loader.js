export default class {
	requests;
	constructor(sources) {
		this.requests = {
			shaders: {},
			images: {}
		};
		if (sources.shaders)
			for (const name in sources.shaders)
				this.addShader(name, sources.shaders[name]);
		if (sources.images)
			for (const name in sources.images)
				this.addImage(name, sources.images[name]);
	}
	addShader(name, src) {
		this.requests.shaders[name] = fetch(src).then((v) => v.text());
	}
	addImage(name, src) {
		this.requests.images[name] = new Promise((res) => {
			const img = new Image();
			img.src = src;
			img.addEventListener('load', () => res(img));
		});
	}
	get response() {
		return new Promise((res) => {
			const promisesList = [];
			const locs = [];
			for (const name in this.requests.shaders) {
				promisesList.push(this.requests.shaders[name]);
				locs.push({ dir: 'shaders', name });
			}
			for (const name in this.requests.images) {
				promisesList.push(this.requests.images[name]);
				locs.push({ dir: 'images', name });
			}
			Promise.all(promisesList).then((v) => {
				const data = {
					shaders: {},
					images: {}
				};
				v.forEach((v, i) => (data[locs[i].dir][locs[i].name] = v));
				res(data);
			});
		});
	}
}
