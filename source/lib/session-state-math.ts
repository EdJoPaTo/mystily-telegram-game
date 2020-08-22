import {Context, Session} from './context'
import {ensureBetweenFinite} from './js-helper'
import {MINUTE, HOUR} from './unix-time'
import {STARTING_RESOURCES} from './model/resources'
import {ZERO_BARRACKS_UNITS} from './model/units'
import {ZERO_BUILDINGS, BUILDINGS, calcResourceIncomeFromBuilding, calcStorageCapacity} from './model/buildings'
import * as resourceMath from './model/resource-math'

function initWhenMissing(session: Session, now: number): void {
	if (!session.barracksUnits) {
		session.barracksUnits = {...ZERO_BARRACKS_UNITS}
	}

	if (!session.buildings) {
		session.buildings = {...ZERO_BUILDINGS}
	}

	for (const building of BUILDINGS) {
		if (!session.buildings[building]) {
			session.buildings = {
				...session.buildings,
				[building]: 0
			}
		}
	}

	if (!session.immuneToPlayerAttacksUntil) {
		session.immuneToPlayerAttacksUntil = now + (2 * HOUR)
	}

	if (!session.lastMysticAttack) {
		session.lastMysticAttack = now
	}

	if (!session.resources || !session.resourcesTimestamp) {
		session.resourcesTimestamp = now
		session.resources = {...STARTING_RESOURCES}
	}

	if (!session.spies) {
		session.spies = []
	}

	if (!session.wallguards) {
		session.wallguards = 0
	}
}

function calcCurrentResources(session: Session, now: number): void {
	const totalSeconds = now - session.resourcesTimestamp
	const totalMinutes = totalSeconds / MINUTE

	const incomePerMinute = resourceMath.sum(
		...BUILDINGS.map(building => calcResourceIncomeFromBuilding(building, session.buildings[building]))
	)
	const totalIncome = resourceMath.multiply(incomePerMinute, totalMinutes)

	const withIncome = resourceMath.sum(
		session.resources,
		totalIncome
	)

	const storageCapacity = calcStorageCapacity(session.buildings.storage)
	session.resources = resourceMath.apply(
		(amount, resource) => ensureBetweenFinite(0, storageCapacity[resource], Math.round(amount)),
		withIncome
	)
	session.resourcesTimestamp = now
}

export function updateSession(session: Session, now: number): void {
	initWhenMissing(session, now)
	calcCurrentResources(session, now)
}

export function middleware(): (ctx: Context, next: () => Promise<void>) => Promise<void> {
	return async (ctx, next) => {
		const now = Date.now() / 1000
		updateSession(ctx.session, now)
		return next()
	}
}
