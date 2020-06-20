import {applyOnEachRecordKey, joinTwoRecords} from '../js-helper'

import {Resources, RESOURCES, ZERO_RESOURCES, Resource} from './resources'

export function isEnough(has: Resources, need: Resources): boolean {
	return RESOURCES.every(r => has[r] >= need[r])
}

export function apply(func: (amount: number, resource: Resource) => number, o: Resources): Resources {
	return applyOnEachRecordKey(func, o)
}

export function reduce(func: (a: number, b: number, resource: Resource) => number, ...parts: readonly Resources[]): Resources {
	return parts.reduce((collector, add) => joinTwoRecords(func, collector, add))
}

export function multiply(base: Resources, factor: number): Resources {
	return apply(o => o * factor, base)
}

export function sum(...parts: readonly Resources[]): Resources {
	return reduce((a, b) => a + b, ZERO_RESOURCES, ...parts)
}

export function subtract(subtrahend: Resources, minuend: Resources): Resources {
	return joinTwoRecords((a, b) => a - b, subtrahend, minuend)
}
