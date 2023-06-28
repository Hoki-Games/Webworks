declare global	{
	interface Math {
		/** Clamps the given value between the given minimum and maximum values. */
		clamp(value: number, min: number, max: number): number

		/** Rounds the given to the given number of decimal places. */
		dround(value: number, n: number): number
	}

	function sleep(ms: number): Promise<void>
}

Math.clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(min, value), max)

Math.dround = (value: number, n: number, d = 10 ** n) => Math.round(value * d) / d

globalThis.sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export {}