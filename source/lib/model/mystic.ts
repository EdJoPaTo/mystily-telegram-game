import {Army, UnitStats} from './battle-math'
import {BASE_ATTACK} from './units'

type QNumber = string

export interface Mystic {
	readonly qNumber: QNumber;
	readonly remainingHealth: number;
	readonly maxHealth: number;
}

export function createMysticFromEntityId(mysticId: QNumber): Mystic {
	const maxHealth = calcMysticStrength(mysticId)
	return {
		qNumber: mysticId,
		maxHealth,
		remainingHealth: maxHealth
	}
}

function calcMysticStrength(mystic: QNumber): number {
	const numbersOfQNumber = mystic
		.split('')
		.slice(1)
		.map(o => Number(o))

	const baseStrength = numbersOfQNumber.reduce((a, b) => a + b, 0)
	return baseStrength * 250
}

export function getMysticAsArmy(remainingHealth: number, amountFactor: number): Army {
	const amount = Math.max(1, amountFactor)

	const per = Math.floor(remainingHealth / amount)
	const leftover = remainingHealth - (per * amount)

	const result: UnitStats[] = []
	for (let i = 0; i < amount; i++) {
		result.push({
			type: 'mystic',
			attack: BASE_ATTACK.mystic,
			remainingHealth: i === 0 ? per + leftover : per
		})
	}

	return result
}
