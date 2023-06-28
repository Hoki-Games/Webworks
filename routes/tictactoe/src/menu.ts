import './utils.js'

export interface DisableableElement extends HTMLElement {
	disable: boolean
}

export interface SliderElement extends DisableableElement {
	value: number
	min: number
	max: number
	buttons: HTMLSpanElement[]
}

export type Input = HTMLElement & { value: any }
export interface ListElement<T extends [...Input[]] = Input[]> extends DisableableElement {
	value: { [I in keyof T]: T[I]['value'] } & { length: T['length'] }
	options: T
}

type OptionElement = SliderElement | ListElement

export interface MenuElement<T extends PageElement[] = PageElement[], N extends number = number> extends HTMLElement {
	overlay: boolean
	backdrop: boolean
	active: N
	activePage: T[N]
	pages: T
}

export interface PageElement<T extends [...OptionElement[]] = OptionElement[]> extends HTMLElement {
	values: { [I in keyof T]: T[I]['value'] } & { length: T['length'] }
	options: T
}

export class SliderEvent extends Event {
	#oldValue: number
	value: number

	constructor(value: number, oldValue: number, options?: EventInit) {
		super('change', options)

		this.value = value
		this.#oldValue = oldValue
	}

	get oldValue() {
		return this.#oldValue
	}
}

const disableProperty = {
	get(this: HTMLElement) {
		return this.classList.contains('disable')
	},
	set(this: HTMLElement, val: boolean) {
		if (val) this.classList.add('disable')
		else this.classList.remove('disable')

		this.querySelectorAll('input').forEach(v => {
			v.disabled = val
		})
	}
} as PropertyDescriptor

const proxyHandler = {
	get(t, p) {
		const i = +p.toString()

		if (Number.isInteger(i)) {
			return t[i].value
		}

		if (p in t) {
			return t.map(v => v.value)[p]
		}
	},
	set(t, p, v) {
		const i = +p.toString()

		if (Number.isInteger(i)) {
			t[i].value = v
			return true
		}

		return false
	}
} as ProxyHandler<(HTMLInputElement | OptionElement)[]>

export default () => {
	document.querySelectorAll<MenuElement>('.menu').forEach(menu => {
		const pages = Array.from(menu.querySelectorAll<PageElement>('.page'))

		let activePage = pages.findIndex(v => v.classList.contains('active'))
		let overlay = false
		let backdrop = false

		pages.forEach(page => {
			const options = Array.from(page.children).filter(elem => {
				if (elem.classList.contains('slider')) {
					const slider = elem as SliderElement

					let value = 0
					let min = -Infinity
					let max = Infinity

					const updateListeners = () => {
						const btns = slider.buttons

						for (let i = 0; i < btns.length; i++) {
							const btn = btns[i]
							const isSelected = i === value
							const inRange = min <= i && i <= max

							btn.classList.remove('selected', 'blocked')
							if (isSelected) {
								btn.onpointerdown = null
								btn.classList.add('selected')
							} else if (!inRange) {
								btn.onpointerdown = null
								btn.classList.add('blocked')
							} else {
								btn.onpointerdown = () => { slider.value = i }
							}
						}
					}

					const updateSlider = () => {
						document.fonts.ready.then(() => {
							let offsetLeft = 0
							for (let i = 0; i < value; i++) {
								offsetLeft += btns[i].getBoundingClientRect().width
							}

							const elemWidth = btns[value].getBoundingClientRect().width
							const pWidth = slider.getBoundingClientRect().width
							const pos = Math.dround(offsetLeft / pWidth * 100, 5)
							const width = Math.dround(elemWidth / pWidth * 100, 5)

							slider.style.setProperty('--pos', pos + '%')
							slider.style.setProperty('--width', width + '%')
						})
					}

					Object.defineProperties(slider, {
						disable: disableProperty,
						buttons: {
							get() { return Array.from(slider.getElementsByTagName('span')) }
						},
						min: {
							get() { return min },
							set(val: number) {
								min = val
								if (min > value) slider.value = min
								else updateListeners()
							}
						},
						max: {
							get() { return max },
							set(val: number) {
								max = val
								if (max < value) slider.value = max
								else updateListeners()
							}
						},
						value: {
							get() {
								return value
							},
							set(val) {
								if (this.disable) return
								const btns = slider.buttons
								const v = Math.clamp(val, Math.max(0, min), Math.min(btns.length - 1, max))

								const selI = btns.findIndex(btn => btn.classList.contains('selected'))

								const event = new SliderEvent(v, value, { cancelable: true, bubbles: false })
								if (selI !== v && slider.dispatchEvent(event)) {
									value = event.value ?? v

									updateListeners()
									updateSlider()
								}
							}
						}
					})

					updateListeners()
					updateSlider()

					const btns = slider.buttons

					slider.addEventListener('keydown', e => {
						if (e.key === 'ArrowRight')
							slider.value = value >= (Math.min(btns.length - 1, max)) ? Math.max(0, min) : value + 1
						else if (e.key === 'ArrowLeft')
							slider.value = value <= (Math.max(0, min)) ? Math.min(btns.length - 1, max) : value - 1
					})

					return true
				} else if (elem.classList.contains('inline')) {
					const inline = elem as ListElement

					const options = Array.from(inline.querySelectorAll('input'))

					if (!options.length) return false

					const proxy = new Proxy(options, proxyHandler)

					Object.defineProperties(inline, {
						disable: disableProperty,
						value: {
							get() {
								return proxy
							}
						},
						options: {
							get() {
								return options
							}
						}
					})

					return true
				}

				return false
			}) as OptionElement[]

			const proxy = new Proxy(options, proxyHandler)

			Object.defineProperties(page, {
				values: {
					get() {
						return proxy
					}
				},
				options: {
					get() {
						return options
					}
				}
			})
		})

		menu.querySelectorAll<HTMLElement>('.button').forEach(button => {
			button.addEventListener('keydown', e => {
				if (e.key === 'Enter') button.dispatchEvent(new PointerEvent('pointerdown'))
			})

			button.addEventListener('keyup', e => {
				if (e.key === 'Enter') button.dispatchEvent(new PointerEvent('pointerup'))
			})
		})

		Object.defineProperties(menu, {
			active: {
				get() {
					return activePage
				},
				set(val: number) {
					const sel = menu.activePage

					if (sel) sel.classList.remove('active')

					const i = Math.clamp(val, -1, pages.length - 1)

					if (i !== -1) pages[i].classList.add('active')

					activePage = i
				}
			},
			activePage: {
				get() {
					return pages[activePage]
				},
				set(val: PageElement) {
					const i = pages.findIndex(v => val === v)

					if (i >= 0) menu.active = i
				}
			},
			pages: {
				get() {
					return pages
				}
			},
			overlay: {
				get() {
					return overlay
				},
				set(val: boolean) {
					overlay = val

					if (val) menu.classList.add('overlay')
					else menu.classList.remove('overlay')
				}
			},
			backdrop: {
				get() {
					return backdrop
				},
				set(val: boolean) {
					backdrop = val

					if (val) menu.classList.add('backdrop')
					else menu.classList.remove('backdrop')
				}
			}
		})
	})
}