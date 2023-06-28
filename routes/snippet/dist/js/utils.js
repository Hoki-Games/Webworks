Math.clamp = (value, min, max) => Math.min(Math.max(min, value), max);
Math.dround = (value, n, d = 10 ** n) => Math.round(value * d) / d;
globalThis.sleep = (ms) => new Promise(r => setTimeout(r, ms));
export {};
