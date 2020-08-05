import {applyOnEachRecordKey, joinTwoRecords} from '../js-helper'

import {Resources, RESOURCES, ZERO_RESOURCES, Resource} from './resources'

export function isEnough(has: Resources, need: Resources): boolean {
	return RESOURCES.every(r => has[r] >= need[r])
}

export function areAny(amount: Resources): boolean {
	return RESOURCES.some(r => amount[r] > 0)
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

export function enoughFor(has: Resources, one: Resources): number {
	const ofResource = reduce((a, b) => a / b, has, one)
	const min = Math.min(...RESOURCES.map(r => ofResource[r]))
	return Math.floor(min)
}

export function getKindsOfMissingResources(has: Resources, needs: Resources): readonly Resource[] {
	const missing: Resource[] = []
	for (const resource of RESOURCES) {
		if (needs[resource] > has[resource]) {
			missing.push(resource)
		}
	}

	return missing
}
