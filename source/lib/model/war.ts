import {MINUTE} from '../unix-time'

const MINIMUM_COOLDOWN_SECONDS = 2 * MINUTE
const FATIGUE_FROM_COOLDOWN_FACTOR = 4

export function calculateBattleFatigue(currentFatigueSeconds: number): Readonly<{cooldownSeconds: number; newFatigueSeconds: number}> {
	const cooldownSeconds = Math.max(MINIMUM_COOLDOWN_SECONDS, currentFatigueSeconds)
	const newFatigueSeconds = cooldownSeconds * FATIGUE_FROM_COOLDOWN_FACTOR
	return {cooldownSeconds, newFatigueSeconds}
}
