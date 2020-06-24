import {MINUTE} from '../unix-time'

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
