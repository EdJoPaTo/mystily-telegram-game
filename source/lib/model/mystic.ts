import {Army, BASE_ATTACK, UnitStats} from './army'

export function calcMysticStrength(mystic: string): number {
	const numbersOfQNumber = mystic
		.split('')
		.slice(1)
		.map(o => Number(o))

	const baseStrength = numbersOfQNumber.reduce((a, b) => a + b, 0)
	return baseStrength * 100
}

export function getMysticAsArmy(remainingHealth: number, playerPlaceOfWorshipLevel: number): Army {
	const amount = Math.max(1, playerPlaceOfWorshipLevel * 3)

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
