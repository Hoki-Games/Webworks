import './utils.js'

type LoopFunc = (v: number, s?: number, d?: number) => number
type TestList = [number, number][]
type TestFunc = (v0: number, v1: number) => boolean

const TASKS_HIDDEN = false

const DISPLAY_TEXT = 1
const DISPLAY_LOOP = 2

const checkFunc = (f: LoopFunc, s: number, d: number, v0: number, v1: number, t = 1e-10) => {
	const dif = Math.abs(v1 - f(v0, s, d))
	return dif < t
}

const tests = [{
	title: 'For [s=0, d=1] | [2.5=>0.5], [-5=>0]',
	checkFunc(f: LoopFunc) {
		const cf = checkFunc.bind(0, f, 0, 1) as TestFunc
		const check = ([
			[2.5, 0.5],
			[-5, 0]
		] as TestList).every(v => cf(...v))

		return check
	},
	fail() {
		console.info('Test 1 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'For [s=2, d=1] | [0.5=>2.5], [-3=>2]',
	checkFunc(f: LoopFunc) {
		const cf = checkFunc.bind(0, f, 2, 1) as TestFunc
		const check = ([
			[0.5, 2.5],
			[-3, 2]
		] as TestList).every(v => cf(...v))

		return check
	},
	fail() {
		console.info('Test 2 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'For [s=-3.5, d=1.5] | [1.5 => -3], [4 => -3.5], \n[-2 => -3.5], [-1.99 => -3.49]',
	checkFunc(f: LoopFunc) {
		const cf = checkFunc.bind(0, f, -3.5, 1.5) as TestFunc
		const check = ([
			[1.5, -3],
			[4, -3.5],
			[-2, -3.5],
			[-1.99, -3.49]
		] as TestList).every(v => cf(...v))

		return check
	},
	fail() {
		console.info('Test 3 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'For [s=-1e10, d=2e10] | [-2e10 => 0],\n[-8e10-22.22  => -22.22], [1e11+3.14 => 3.14]',
	checkFunc(f: LoopFunc) {
		const cf = checkFunc.bind(0, f, -1e10, 2e10) as TestFunc
		const check = ([
			[-2e10, 0, 1e-5],
			[-8e10 - 22.22, -22.22, 1e-5],
			[1e11 + 3.14, 3.14, 1e-5]
		] as unknown as TestList).every(v => cf(...v))

		return check
	},
	fail() {
		console.info('Test 4 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'For [s=-3.1415, d=0.1337] | [2.718 => -3.0311],\n[10  => -3.1026], [1e6 => -3.1335]',
	alt: 'Here goes some quite long text with more symbols than one line can fit',
	checkFunc(f: LoopFunc) {
		const cf = checkFunc.bind(0, f, -3.1415, 0.1337) as TestFunc
		const check = ([
			[2.718, -3.0311],
			[10, -3.1026],
			[1e6, -3.1335]
		] as unknown as TestList).every(v => cf(...v))

		return check
	},
	fail() {
		console.info('Test 5 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'Code length must not exceed 100 symbols (whitespaces and semicolons do not count)',
	alt: 'Here goes some quite long text with more symbols than one line can fit. And a little more over it just to be sure',
	checkFunc: (f: LoopFunc, s: string) => s.replace(/\s|;/g, '').length <= 100,
	fail() {
		console.info('Test 6 failed')
	},
	elem: null as HTMLDivElement
}, {
	title: 'Code must fully execute in less than 1 ms',
	checkFunc: (f: LoopFunc) => {
		const start = performance.now()
		const v = f(1e11 + Math.random() + 1, -1e10, 2e10)
		const time = performance.now() - start
		return time <= 1 && v
	},
	fail() {
		console.info('Test 7 failed')
	},
	elem: null as HTMLDivElement
}]

document.addEventListener('DOMContentLoaded', () => {
	const meterText = document.getElementById('meter-text') as HTMLDivElement
	const display = document.getElementById('display') as HTMLCanvasElement
	const sval = document.getElementById('sval') as HTMLInputElement
	const dval = document.getElementById('dval') as HTMLInputElement
	const expandable = document.getElementsByClassName('expandable')[0] as HTMLDivElement
	const ival = document.getElementById('ival') as HTMLInputElement
	const rval = document.getElementById('rval') as HTMLDivElement
	const expander = document.getElementById('expander') as HTMLDivElement
	const input = document.getElementById('input') as HTMLTextAreaElement
	const submit = document.getElementById('submit') as HTMLDivElement
	const ddcontainer = document.getElementsByClassName('dropdown-list')[0] as HTMLDivElement
	const ddlist = document.getElementById('list') as HTMLDivElement

	const segCount = 12
	const scale = 4
	const delWidth = scale
	const delHeight = scale * 2
	const segWidth = 10 * scale
	const segHeight = 8 * scale
	display.width = segCount * segWidth + delWidth
	display.height = segHeight
	const ctx = display.getContext('2d')

	sval.value = '0'
	dval.value = '1'
	ival.value = '0'

	let loopFunc = (v => v) as LoopFunc
	let displayState = 0
	let originTime = performance.now()
	let displayText = 'Unknown error!'
	let s = 0, d = 1, i = 0

	const drawDisplay = (time: number) => {
		const dt = (time - originTime) / 1000

		ctx.clearRect(0, 0, display.width, display.height)
		switch (displayState) {
			case DISPLAY_TEXT:
				meterText.innerText = displayText
				break

			case DISPLAY_LOOP:
				meterText.innerText = ''
				const val = Math.trunc(loopFunc(dt, s, d) * segWidth)
				ctx.fillStyle = 'aquamarine'
				const halfWidth = segWidth * segCount / 2
				ctx.fillRect(halfWidth + Math.trunc(s * segWidth), 0, Math.trunc(d * segWidth) + (delWidth - 1), segHeight)
				ctx.fillStyle = 'indianred'
				ctx.fillRect(halfWidth + val, 0, 4, segHeight)
				ctx.fillStyle = 'black'
				const textOffset = 2
				ctx.font = `bold ${segHeight - (delHeight + textOffset) * 2}px sans-serif`
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				for (let i = 0; i < display.width; i += segWidth) {
					ctx.fillRect(i, 0, delWidth, delHeight)
					ctx.fillRect(i, segHeight - delHeight, delWidth, delHeight)
					const segI = (i - halfWidth) / segWidth
					ctx.fillText(`${segI}`, i + delWidth / 2, segHeight / 2 + textOffset)
				}
				break

			default:
				meterText.innerText = 'IDLE'
		}

		requestAnimationFrame(drawDisplay)
	}

	ddlist.innerHTML = ''
	tests.forEach((v, i) => {
		v.elem = document.createElement('div')
		v.elem.innerText = TASKS_HIDDEN ? `Task ${i + 1}${v.alt ? `: ${v.alt}` : ''}` : v.title
		ddlist.appendChild(v.elem)
	})

	ddlist.style.setProperty('--offset', `calc(1.4em / .6 - ${ddlist.getBoundingClientRect().height}px)`)

	drawDisplay(originTime)

	const updateS = (n: boolean, c: boolean) => {
		let v = c ? .1 : 1
		if (!n) v = -v
		s = Math.dround(s + v, 1)
		sval.value = `${s}`
	}
	const updateD = (n: boolean, c: boolean) => {
		let v = c ? .1 : 1
		if (!n) v = -v
		d = Math.dround(d + v, 1)
		dval.value = `${d}`
	}
	const updateI = (n: boolean, c: boolean) => {
		let v = c ? .1 : 1
		if (!n) v = -v
		i = Math.dround(i + v, 1)
		ival.value = `${i}`
		rval.innerText = `${Math.dround(loopFunc(i, s, d), 2)}`
	}

	sval.addEventListener('change', () => {
		if (sval.validity.valid) s = +sval.value
	})
	dval.addEventListener('change', () => {
		if (dval.validity.valid) d = +dval.value
	})
	ival.addEventListener('change', () => {
		if (ival.validity.valid) {
			i = +ival.value
			rval.innerText = `${Math.dround(loopFunc(i, s, d), 2)}`
		}
	})

	sval.addEventListener('wheel', e => {
		e.preventDefault()
		e.stopPropagation()
		updateS(e.deltaY < 0, e.ctrlKey)
	}, { passive: false })
	dval.addEventListener('wheel', e => {
		e.preventDefault()
		e.stopPropagation()
		updateD(e.deltaY < 0, e.ctrlKey)
	}, { passive: false })
	ival.addEventListener('wheel', e => {
		e.preventDefault()
		e.stopPropagation()
		updateI(e.deltaY < 0, e.ctrlKey)
	}, { passive: false })

	sval.addEventListener('keydown', e => {
		if (e.key === 'ArrowUp') updateS(true, e.ctrlKey)
		else if (e.key === 'ArrowDown') updateS(false, e.ctrlKey)
	})
	dval.addEventListener('keydown', e => {
		if (e.key === 'ArrowUp') updateD(true, e.ctrlKey)
		else if (e.key === 'ArrowDown') updateD(false, e.ctrlKey)
	})
	ival.addEventListener('keydown', e => {
		if (e.key === 'ArrowUp') updateI(true, e.ctrlKey)
		else if (e.key === 'ArrowDown') updateI(false, e.ctrlKey)
	})

	submit.addEventListener('pointerup', () => {
		const txt = (s = 'Unknown error!') => {
			displayText = s
			displayState = 1
		}
		const scr = input.value
		try {
			const f = new Function('v', 's=0', 'd=1', scr) as LoopFunc
			const v = f(3.1415)

			if (v === undefined) txt('Value is undefined!')
			else if (typeof v !== 'number') txt('Value is not a number!')
			else if (Number.isNaN(v)) txt('Value is NaN!')
			else if (!Number.isFinite(v)) txt('Value is not finit!')
			else {
				originTime = performance.now()
				loopFunc = f
				rval.innerText = `${Math.dround(loopFunc(i, s, d), 2)}`
				txt('Mission complete')

				let flag = true
				for (const test of tests) {
					const b = test.checkFunc(f, scr)

					if (b) {
						test.elem.classList.add('true')
					} else {
						test.elem.classList.remove('true')
						if (flag) {
							test.fail()
							displayState = 2
							flag = false
						}
					}
				}
			}

			if (submit.innerText === '▶') {
				submit.innerText = '↻'
				submit.style.transform = 'rotate(90deg)'
				submit.style.fontWeight = 'bold'
				submit.style.lineHeight = '1em'

				ddcontainer.classList.remove('closed')
			}
		} catch(e) { txt('Syntax error!') }
	})

	expander.addEventListener('pointerdown', () => {
		if (expandable.classList.contains('open'))
			expandable.classList.remove('open')
		else expandable.classList.add('open')
	})

	document.getElementById('tab').addEventListener('pointerdown', () => {
		if (ddcontainer.classList.contains('closed'))
			ddcontainer.classList.remove('closed')
		else ddcontainer.classList.add('closed')
	})
})