import {Army, BASE_ATTACK, UnitStats} from './army'

export function calcMysticStrength(mystic: string): number {
	const numbersOfQNumber = mystic
		.split('')
		.slice(1)
		.map(o => Number(o))

	const baseStrength = numbersOfQNumber.reduce((a, b) => a + b, 0)
	return baseStrength * 200
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
