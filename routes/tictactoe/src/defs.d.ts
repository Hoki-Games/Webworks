import { ListElement, MenuElement, PageElement, SliderElement } from "./menu"

export type CellState = 0 | 1 | 2
export type CellCoords = [number, number]
export type ZeroCellCoords = [0, number] | [number, 0]

export type CellDir = -1 | 0 | 1

export type Grid = CellState[][]

export type TurnFunc = (..._: any[]) => Promise<CellCoords>

export type CellCoordTransformator = (cell: CellCoords) => CellCoords

export type Mark = 1 | 2

export interface Unit {
	name: string
	makeTurn(): Promise<CellCoords>
	updateGrid(): void
	reset(): void
}

export type Guess = {
	c: CellCoords
	m: Mark
	res?: Guess[]
}

export interface RatedGuess extends Guess {
	wr: number
	lr: number
}

/** 0 - Nothing; 1 - x won; 2 - o won; 3 - draw */
export type Rate = 0 | 1 | 2 | 3

export interface MenuButton<R> {
	t: string
	c: string
	l: (e: PointerEvent) => R
}

export type Options = {
	p2: 'me' | 'ai' | 'net'
	diff: 0 | 1 | 2 | 3
	grid: [number, number]
	winLine: number
	first: boolean
}

export type OptionsMenu = MenuElement<[
	PageElement<[
		SliderElement,
		SliderElement,
		ListElement<[HTMLInputElement, HTMLInputElement]>,
		SliderElement,
		SliderElement
	]>,
	PageElement<[ListElement<[HTMLInputElement]>]>,
	PageElement<[]>,
	PageElement<[]>
]>

/** 
 * 0 - Me  
 * 1 - AI  
 * 2 - Remote
 */
export type UnitType = 0 | 1 | 2

export type Mathchup = [UnitType, UnitType]

export type Turn = {
	c: CellCoords
	prompt: string
}