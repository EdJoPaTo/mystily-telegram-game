const allLetters = ['', 'k', 'M', 'B', 'T']

export function formatNumberShort(value: number, isInteger = false): string {
	if (!value && value !== 0) {
		return 'NaN'
	}

	const isNegative = value < 0
	if (isNegative) {
		value *= -1
	}

	const exponent = value === 0 ? 0 : Math.floor(Math.log10(value))
	const engineerExponentLevel = Math.max(0, Math.floor(exponent / 3))
	const engineerExponent = engineerExponentLevel * 3
	const letter = allLetters[engineerExponentLevel]
	const exploded = 10 ** engineerExponent
	const shortValue = value / exploded

	let fractionDigits = Math.min(2, 3 - (1 + exponent - engineerExponent))
	if (isInteger && engineerExponentLevel === 0) {
		fractionDigits = 0
	}

	const valueString = shortValue.toFixed(fractionDigits)
	return (isNegative ? '-' : '') + valueString + letter
}

export function formatPercentage(percentage: number): string {
	const hundred = percentage * 100
	return hundred.toFixed(0) + '%'
}

export function formatBonusPercentage(bonusPercentage: number): string {
	const bonus = (bonusPercentage - 1) * 100
	const sign = bonus >= 0 ? '+' : ''
	return sign + bonus.toFixed(0) + '%'
}
