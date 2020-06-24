import {Context, Session} from './context'
import {ensureBetweenFinite} from './js-helper'
import {MINUTE, HOUR} from './unix-time'
import {STARTING_RESOURCES} from './model/resources'
import {ZERO_BUILDINGS, BUILDINGS, calcResourceIncomeFromBuilding, calcStorageCapacity} from './model/buildings'
import {ZERO_UNITS} from './model/units'
import * as resourceMath from './model/resource-math'

function initWhenMissing(session: Session, now: number): void {
	if (!session.buildings) {
		session.buildings = {...ZERO_BUILDINGS}
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

	if (!session.units) {
		session.units = {...ZERO_UNITS}
	}
}

function calcCurrentResources(session: Session, now: number): void {
	const totalSeconds = now - session.resourcesTimestamp
	const totalMinutes = Math.floor(totalSeconds / MINUTE)

	if (totalMinutes > 0) {
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
}

export function middleware(): (ctx: Context, next: () => Promise<void>) => Promise<void> {
	return async (ctx, next) => {
		const now = Date.now() / 1000

		initWhenMissing(ctx.session, now)
		calcCurrentResources(ctx.session, now)

		return next()
	}
}
