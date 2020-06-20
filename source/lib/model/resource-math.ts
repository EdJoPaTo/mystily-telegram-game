import {Resources, RESOURCES, ZERO_RESOURCES} from './resources'

export function isEnough(has: Resources, need: Resources): boolean {
	return RESOURCES.every(r => has[r] >= need[r])
}

function reduceTwo(func: (a: number, b: number) => number, a: Resources, b: Resources): Resources {
	return {
		food: func(a.food, b.food),
		iron: func(a.iron, b.iron),
		loam: func(a.loam, b.loam),
		stone: func(a.stone, b.stone),
		wood: func(a.wood, b.wood)
	}
}

export function apply(func: (o: number) => number, o: Resources): Resources {
	return reduceTwo(func, o, ZERO_RESOURCES)
}

export function reduce(func: (a: number, b: number) => number, ...parts: readonly Resources[]): Resources {
	return parts.reduce((collector, add) => reduceTwo(func, collector, add))
}

export function multiply(base: Resources, factor: number): Resources {
	return apply(o => o * factor, base)
}

export function sum(...parts: readonly Resources[]): Resources {
	return reduce((a, b) => a + b, ZERO_RESOURCES, ...parts)
}

export function subtract(subtrahend: Resources, minuend: Resources): Resources {
	return reduceTwo((a, b) => a - b, subtrahend, minuend)
}
