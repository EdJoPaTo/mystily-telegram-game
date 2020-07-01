import randomItem from 'random-item'

import {MINUTE} from '../unix-time'

import {BarracksUnits, PLAYER_BARRACKS_ARMY_TYPES, UNIT_LOOT_CAPACITY} from './units'
import {Resources, ZERO_RESOURCES, RESOURCES} from './resources'

const IMMUNITY_MINIMUM_SECONDS = 40 * MINUTE
const IMMUNITY_RANDOM_SECONDS_RANGE = 20 * MINUTE

const MINIMUM_COOLDOWN_SECONDS = 2 * MINUTE
const FATIGUE_FROM_COOLDOWN_FACTOR = 4

export function calculateBattleFatigue(currentFatigueSeconds: number): Readonly<{cooldownSeconds: number; newFatigueSeconds: number}> {
	const cooldownSeconds = Math.max(MINIMUM_COOLDOWN_SECONDS, currentFatigueSeconds)
	const newFatigueSeconds = cooldownSeconds * FATIGUE_FROM_COOLDOWN_FACTOR
	return {cooldownSeconds, newFatigueSeconds}
}

export function calculatePlayerAttackImmunity(now = Date.now() / 1000): number {
	const immunityLength = IMMUNITY_MINIMUM_SECONDS + (Math.random() * IMMUNITY_RANDOM_SECONDS_RANGE)
	return now + immunityLength
}

export function calculateLoot(remainingAttackers: BarracksUnits, targetResources: Resources): Resources {
	const loot = {...ZERO_RESOURCES}

	for (const armyType of PLAYER_BARRACKS_ARMY_TYPES) {
		const maxLootAmount = UNIT_LOOT_CAPACITY[armyType]
		for (let i = 0; i < remainingAttackers[armyType]; i++) {
			const resource = randomItem(RESOURCES)
			const remaining = targetResources[resource] - loot[resource]
			const amount = Math.min(maxLootAmount, remaining)
			loot[resource] += amount
		}
	}

	return loot
}
