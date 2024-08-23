import Scene from './eng/graphics/Scene.js';
import Loader from './eng/loader.js';
import { bezier, clamp, vec2, Vector2 } from './eng/math.js';
import { CircleObject, TextureObject } from './eng/objects.js';
import PositionedObject from './eng/objects/PositionedObject.js';
import PolylineObject from './polyline.js';
import Animation from './eng/animation/Animation.js';
import TimedAnimationSequence from './eng/animation/TimedAnimationSequence.js';
import Blank from './eng/animation/Blank.js';
import TimedAnimation from './eng/animation/TimedAnimation.js';
import CopyTransformsConstraint from './eng/physics/CopyTransformsConstraint.js';
import resizer from './resizer.mjs';
const PI2 = Math.PI * 2;
const N1_3 = 1 / 3;
const BlueI = [-1, -.212, -.184];
const dial = globalThis.dial = (n, r = 1) => {
	const p = [];
	const pn = PI2 / n;
	for (let i = 0; i < n; i++) {
		const d = i * pn + Math.PI * (.5 - 1 / n);
		p.push([
			-Math.cos(d) * r,
			-Math.sin(d) * r
		]);
	}
	return p;
};
const bezEaseInOut = bezier(.42, 0, .58, 1)(100);
const bezEaseCustom = bezier(.42, 0, .22, 1)(100);
window.addEventListener('load', async () => {
	const display = document.getElementById('display');
	const fps = document.getElementById('fps');
	const titleSpan = document.getElementById('title');
	const letters = Array.from(titleSpan.children);
	const charArr = (s, d) => [...Array(d)].map((_, i) => String.fromCharCode(i + s));
	const alphabet = [...charArr(97, 26), ...charArr(65, 26), ...'@#$&!?'];
	const hitR = Math.round(Math.random() * 4) + 3;
	const hitCount = [
		hitR + 2,
		hitR + 5,
		hitR + 1,
		hitR + 3,
		hitR + 4,
		hitR + 2,
		hitR
	];
	const letterHits = globalThis.lH = letters.map((v, i) => ({
		elem: v,
		hit: hitCount[i],
		char: 'WEngine'[i]
	}));
	const props = await new Loader({
		shaders: {
			pV: './shaders/polyline.vert',
			pF: './shaders/polyline.frag',
			gbV: './shaders/gradient.vert',
			gbF: './shaders/gradient.frag',
			mV: './shaders/moon.vert',
			mF: './shaders/moon.frag'
		},
		images: {
			back: './back_s.png',
			moon: './moon_s.png',
			satellite: './satellite.png',
			brokenSatellite: './broken satellite.png',
			smoke1: './smoke1.png',
			smoke2: './smoke2.png',
			smoke3: './smoke3.png'
		}
	}).response;
	const scene = globalThis.scene = new Scene({
		canvas: display,
		settings: {
			backgroundColor: '#0000',
			premultipliedAlpha: false,
			enable: [WebGL2RenderingContext.BLEND],
			blendFunc: [
				WebGL2RenderingContext.SRC_ALPHA,
				WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA
			],
			viewport: [0, 0, 1, 1]
		}
	});
	const polyP1 = new PolylineObject({
		scene,
		shaders: [
			{
				source: props.shaders.pV,
				type: 'VERTEX_SHADER'
			},
			{
				source: props.shaders.pF,
				type: 'FRAGMENT_SHADER'
			}
		],
		width: 0.075,
		miterLimit: 2.5,
		lineJoin: 'bevel',
		closed: true,
		zIndex: 100
	});
	const circleP3 = new CircleObject({
		scene,
		location: [0, 0],
		color: '#fff0',
		scale: .675,
		innerR: .525 / .675
	});
	const rectP3 = new PositionedObject({
		scene,
		shaders: [{
				source: props.shaders.gbV,
				type: 'VERTEX_SHADER'
			}, {
				source: props.shaders.gbF,
				type: 'FRAGMENT_SHADER'
			}],
		drawMode: WebGL2RenderingContext.TRIANGLE_STRIP,
		uniforms: {
			u_grad: Float32Array.of(-1),
			u_texture: Int32Array.of(0),
			u_opacity: Float32Array.of(0),
			u_zoom: Float32Array.of(1)
		},
		textures: [{
				img: props.images.back,
				settings: {
					format: WebGL2RenderingContext.RGBA,
					internalformat: WebGL2RenderingContext.RGBA,
					params: {
						TEXTURE_MIN_FILTER: WebGL2RenderingContext.LINEAR,
						TEXTURE_WRAP_S: WebGL2RenderingContext.REPEAT,
						TEXTURE_WRAP_T: WebGL2RenderingContext.REPEAT,
						UNPACK_FLIP_Y_WEBGL: true
					}
				}
			}],
		verts: [
			[-1, 1],
			[1, 1],
			[-1, -1],
			[1, -1]
		],
		zIndex: 200
	});
	const moonP4 = new PositionedObject({
		scene,
		shaders: [{
				source: props.shaders.mV,
				type: 'VERTEX_SHADER'
			}, {
				source: props.shaders.mF,
				type: 'FRAGMENT_SHADER'
			}],
		drawMode: WebGL2RenderingContext.TRIANGLE_STRIP,
		uniforms: {
			u_texture: Int32Array.of(0),
			u_gridSize: Uint32Array.of(10),
			u_grad: Float32Array.of(0)
		},
		textures: [{
				img: props.images.moon,
				settings: {
					format: WebGL2RenderingContext.RGBA,
					internalformat: WebGL2RenderingContext.RGBA,
					params: {
						TEXTURE_MIN_FILTER: WebGL2RenderingContext.LINEAR,
						TEXTURE_WRAP_S: WebGL2RenderingContext.CLAMP_TO_EDGE,
						TEXTURE_WRAP_T: WebGL2RenderingContext.CLAMP_TO_EDGE,
						UNPACK_FLIP_Y_WEBGL: false
					}
				}
			}],
		verts: [
			[-1, 1],
			[1, 1],
			[-1, -1],
			[1, -1]
		],
		zIndex: -1
	});
	moonP4.physics.local.scale(.735, .735);
	const satP5 = new TextureObject({
		scene,
		img: props.images['satellite'],
		tris: [[
				[-1, N1_3],
				[1, N1_3],
				[-1, -N1_3]
			], [
				[-1, -N1_3],
				[1, N1_3],
				[1, -N1_3]
			]],
		uvmap: [[
				[0, 1],
				[1, 1],
				[0, 0]
			], [
				[0, 0],
				[1, 1],
				[1, 0]
			]],
		zIndex: 0
	});
	satP5.physics.local.scale(.15, .15);
	satP5.physics.local.translate(0, .45);
	const animP1 = new TimedAnimation({
		t0: 1000,
		dur: 2000,
		x0: 0,
		dx: 1,
		func: bezEaseInOut
	});
	const animP2Shrink = new TimedAnimation({
		t0: 7500,
		dur: 1500,
		x0: .14,
		dx: -.14
	});
	const animP2 = new TimedAnimationSequence({
		t0: 3000,
		dur: 8000,
		animations: [{
				dur: 1.4,
				anim: new Animation({
					x0: 2,
					dx: 1,
					func: bezEaseInOut
				})
			}, {
				dur: .3,
				anim: new Blank(3)
			}, {
				dur: 1.2,
				anim: new Animation({
					x0: 3,
					dx: 1,
					func: bezEaseInOut
				})
			}, {
				dur: .3,
				anim: new Blank(4)
			}, {
				dur: 4,
				anim: new Animation({
					x0: 4,
					dx: 46,
					func(p) {
						return p ** 2;
					}
				})
			}]
	});
	const animP3 = new TimedAnimation({
		t0: 11000,
		dur: 500,
		x0: .525 / .675,
		dx: -.525 / .675,
		func: bezEaseCustom
	});
	const animP3Grad = new TimedAnimation({
		t0: 10500,
		dur: 2000,
		x0: -1,
		dx: 2,
		func: bezEaseCustom
	});
	const animP4Back = new TimedAnimationSequence({
		t0: 13000,
		dur: 13800,
		animations: [{
				dur: 15,
				anim: new Animation({
					x0: 0,
					dx: 1,
					func: bezEaseCustom
				})
			}, {
				dur: 98,
				anim: new Blank(1)
			}, {
				dur: 25,
				anim: new Animation({
					x0: 1,
					dx: -1,
					func: bezEaseCustom
				})
			}]
	});
	const animP4Moon = new TimedAnimation({
		t0: 9000,
		dur: 7000,
		x0: -0.2,
		dx: 1.4,
		func: bezEaseCustom
	});
	const animP5Moon = new TimedAnimation({
		t0: 14000,
		dur: 1000,
		x0: .735,
		dx: -.285,
		func: bezEaseCustom
	});
	const animP7moon = new TimedAnimation({
		t0: 24000,
		dur: 2000,
		x0: .45,
		dx: -.45,
		func: bezEaseCustom
	});
	const animP7 = new TimedAnimation({
		t0: 24000,
		dur: 3000,
		x0: 1,
		dx: 10,
		func: bezEaseCustom
	});
	const animP8 = new TimedAnimation({
		t0: 27000,
		dur: 600,
		x0: 0,
		dx: 1,
		func: bezEaseCustom
	});
	scene.addObject({ polyP1, circleP3, rectP3, moonP4 });
	scene.addAnimation(animP1, animP2, animP2Shrink, animP3, animP3Grad, animP4Back, animP4Moon, animP5Moon, animP7moon, animP7, animP8);
	let ratio = 1;
	const resize = (w = display.width, h = display.height) => {
		ratio = w / h;
		scene.settings.viewport[2] = display.width = w;
		scene.settings.viewport[3] = display.height = h;
		for (const name in scene.objects) {
			const obj = scene.objects[name];
			if (obj instanceof PositionedObject) {
				obj.ratio = ratio;
			}
		}
		scene.resize();
	};
	resizer.set(display, resize);
	const shuffleChars = () => {
		const lHL = letterHits.length;
		const i = Math.round(Math.random() * (lHL - 1));
		const letter = letterHits[i];
		letter.hit--;
		if (letter.hit) {
			letter.elem.innerText = alphabet[Math.round(Math.random() * (alphabet.length - 1))];
		}
		else {
			letter.elem.innerText = letter.char;
			letter.elem.style.color = 'white';
			letterHits.splice(i, 1);
		}
		if (letterHits.length) {
			const t = 1 - (lHL - 1) / 6;
			setTimeout(shuffleChars, (lHL === 1 && letter.hit === 1) ? 1175 : bezEaseCustom(t) * 150 + 80);
		}
	};
	let startTime;
	let lastTime;
	let rAFID;
	let p3flag = 0;
	let p5flag = 0;
	let p6flag = 0;
	let p7flag = 0;
	let p8flag = 0;
	let satFlag = false;
	let satInc = true;
	let satDist = 0;
	let trans;
	const draw = (globalThis.draw = (time, wasPaused = false) => {
		if (typeof startTime === 'undefined')
			startTime = time;
		if (wasPaused)
			lastTime = time;
		const dt = (time - lastTime) * 0.001;
		lastTime = time;
		scene.updateAnimations(time);
		if (!p3flag)
			recalcPoly(animP2.value);
		if (time < 3000) {
			polyP1.physics.local.scaleX(animP1.value, false);
			polyP1.physics.local.translateX(-.5 * (1 - animP1.value));
			dots[1].physics.local.translateX(animP1.value * 1.2 - .6);
		}
		else if (time < 11000) {
			polyP1.physics.local.scaleX(1, false);
			polyP1.physics.local.translateX(0);
			dots.forEach(dot => {
				dot.physics.local.scale(animP2Shrink.value, animP2Shrink.value);
			});
		}
		else if (time < 14000) {
			p3flag++;
			circleP3.setUniform('u_innerRadius', Float32Array.of(animP3.value));
		}
		else if (time < 15000) {
			p5flag++;
			moonP4.physics.local.scale(animP5Moon.value, animP5Moon.value);
		}
		else if (time >= 24000 && time < 27000) {
			rectP3.setUniform('u_zoom', Float32Array.of(animP7.value));
			const s = animP7moon.value;
			moonP4.physics.local.scale(s, s);
			p7flag++;
		}
		else if (time > 27000) {
			titleSpan.style.opacity = animP8.value.toString();
		}
		if (time > 27200)
			p8flag++;
		if (time > 14200 && !p6flag) {
			const v = satP5.physics.local.t;
			const dist = v.size;
			const dir = v.norm.neg;
			const r = dir.right.rotation;
			satP5.physics.local.rotate(r, false);
			if (dist < satDist && satInc) {
				satInc = false;
				satFlag = !satFlag;
				satP5.zIndex = satFlag ? -2 : 0;
			}
			else if (dist > satDist && !satInc)
				satInc = true;
			if (time > 19200 && dist < .3 && satFlag)
				p6flag = 1;
			satDist = dist;
			satP5.physics.applyAcceleration(dir);
		}
		if (time > 14000) {
			const rot = moonP4.physics.local.r;
			moonP4.physics.local.rotate(rot + dt * .1);
		}
		if (!p7flag) {
			rectP3.setUniform('u_grad', Float32Array.of(animP3Grad.value));
			moonP4.setUniform('u_grad', Float32Array.of(animP4Moon.value));
		}
		rectP3.setUniform('u_opacity', Float32Array.of(animP4Back.value));
		if (p3flag === 1) {
			circleP3.color[3] = 1;
			scene.removeObject('polyP1');
			for (let i = 1; i <= dots.length; i++) {
				scene.removeObject('d' + i);
			}
		}
		else if (p5flag === 1) {
			scene.removeObject('circleP3');
			scene.addObject({ satP5 });
			resize();
			const dir = satP5.physics.local.t.scale(100);
			const mov = dir.right.scale(1);
			satP5.physics.applyAcceleration(dir.sum(mov));
		}
		else if (p6flag === 1) {
			satP5.physics.acceleration = vec2(0);
			satP5.physics.velocity = vec2(0);
			satP5.renderer.setTexture({
				id: 0,
				img: props.images['brokenSatellite'],
				settings: {
					internalformat: WebGL2RenderingContext.RGBA,
					format: WebGL2RenderingContext.RGBA,
					params: {
						TEXTURE_WRAP_S: WebGL2RenderingContext.CLAMP_TO_EDGE,
						TEXTURE_WRAP_T: WebGL2RenderingContext.CLAMP_TO_EDGE,
						TEXTURE_MIN_FILTER: WebGL2RenderingContext.LINEAR,
						UNPACK_FLIP_Y_WEBGL: true
					}
				}
			});
			satP5.physics.local.scale(.333, 1, false);
			const r = satP5.physics.local.r;
			satP5.physics.local.rotate(r - .65);
			const t = satP5.physics.local.t;
			const r1 = satP5.physics.local.t.rotation;
			const r2 = moonP4.physics.local.r;
			const d = satP5.physics.local.t.size;
			const v = Vector2.fromDegree(r1 - r2 + .02, d / .48);
			satP5.physics.local.translate(...v.arr);
			trans = new CopyTransformsConstraint(satP5.physics, moonP4.physics, {
				mixMode: 'beforeFull'
			});
			for (let i = 0; i < 20; i++) {
				const s = new TextureObject({
					scene,
					img: props.images['smoke' + Math.round(Math.random() * 2 + 1)],
					tris: [[
							[-1, 1],
							[1, 1],
							[-1, -1]
						], [
							[-1, -1],
							[1, 1],
							[1, -1]
						]],
					uvmap: [[
							[0, 1],
							[1, 1],
							[0, 0]
						], [
							[0, 0],
							[1, 1],
							[1, 0]
						]],
					zIndex: -2
				});
				const d = vec2(Math.random() * .04 - .02, Math.sin(Math.random() * Math.PI + 13.875) * .04 - .02);
				s.physics.local.scale(.04, .04, false);
				s.physics.local.translate(...t.sum(d).arr);
				s.physics.applyVelocity(d);
				setTimeout(() => {
					scene.removeObject('s' + i);
				}, 600);
				scene.addObject('s' + i, s);
			}
			resize();
			p6flag++;
		}
		if (p8flag === 1) {
			shuffleChars();
		}
		scene.updateLocations(dt);
		trans?.solve();
		scene.draw();
		fps.innerText = `${Math.round(1 / dt)} FPS`;
		rAFID = requestAnimationFrame(draw);
	});
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden')
			rAFID = cancelAnimationFrame(rAFID);
		else if (typeof rAFID === 'undefined')
			draw(performance.now(), true);
	});
	const dots = [];
	const vel = [];
	const updateDots = (tv, p) => {
		const l = dots.length;
		if (l < tv) {
			const d = new CircleObject({
				scene,
				location: [0, 0],
				color: '#fff',
				scale: 0.14,
				zIndex: l
			});
			d.ratio = ratio;
			scene.addObject('d' + dots.push(d), d);
			vel.push(0);
			updateDots(tv, p);
		}
		else if (l > tv) {
			scene.removeObject('d' + l);
			dots.pop();
			vel.pop();
			updateDots(tv, p);
		}
		else {
			dots.forEach((v, i) => {
				const d = p[i];
				const nv = v.physics.local.t.dif(vec2(...d)).size;
				const dv = nv - vel[i];
				vel[i] += clamp(dv, -.0001, .1);
				vel[i] = clamp(vel[i], 0, .015);
				v.physics.local.translate(...d);
			});
		}
	};
	const recalcPoly = (v) => {
		const points = dial(v, .6);
		updateDots(Math.ceil(v), points);
		dots.forEach((p, i) => {
			const k = vel[i] * 60;
			p.color.set([
				1 + BlueI[0] * k,
				1 + BlueI[1] * k,
				1 + BlueI[2] * k,
				1
			]);
		});
		polyP1.setPoints(points);
	};
	resize();
	recalcPoly(2);
	draw(performance.now(), true);
});
