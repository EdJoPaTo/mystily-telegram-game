import {Army} from '../model/battle-math'
import {BarracksArmyType, BASE_ATTACK, BASE_HEALTH, BLOCK_CHANCE, WEAPON_TYPES, UNIT_COST, ArmyType, PLAYER_ARMY_TYPES, UNIT_LOOT_CAPACITY, isBarracksArmyType} from '../model/units'
import {Context} from '../context'

import {costResourcesPart} from './resource'
import {EMOJI} from './emoji'
import {formatPercentage} from './format-number'
import {wikidataInfoHeader} from './generals'

export async function generateUnitDetailsPart(ctx: Context, armyType: ArmyType, amount: number): Promise<string> {
	const reader = await ctx.wd.reader(`army.${armyType}`)
	const attack = BASE_ATTACK[armyType]
	const block = BLOCK_CHANCE[armyType]
	const health = BASE_HEALTH[armyType]
	const loot = isBarracksArmyType(armyType) ? UNIT_LOOT_CAPACITY[armyType] : Number.NaN

	let text = ''
	text += wikidataInfoHeader(reader, {titlePrefix: `${amount}x ${EMOJI[armyType]}`})

	text += '\n'
	const firstLine: string[] = []
	firstLine.push(`${attack.strength}${EMOJI[attack.type]}`)
	firstLine.push(`${health}${EMOJI.health}`)
	if (Number.isFinite(loot)) {
		firstLine.push(`${loot}${EMOJI.loot}`)
	}

	text += firstLine.join('  ')

	text += '\n'
	text += WEAPON_TYPES
		.map(o => `${formatPercentage(block[o])}${EMOJI.defence}${EMOJI[o]}`)
		.join('  ')

	return text
}

export async function generateUnitDetailsAndCostPart(ctx: Context, armyType: BarracksArmyType): Promise<string> {
	const detailsPart = await generateUnitDetailsPart(ctx, armyType, ctx.session.barracksUnits[armyType])
	const costPart = await costResourcesPart(ctx, UNIT_COST[armyType], ctx.session.resources)
	return detailsPart + '\n' + costPart
}

function generateUnitAmountString(armyType: ArmyType, amount: number): string {
	return `${amount}${EMOJI[armyType]}`
}

export function generateArmyOneLine(units: Army): string {
	return PLAYER_ARMY_TYPES
		.map(armyType => {
			const amount = units.filter(o => o.type === armyType).length
			return amount ? generateUnitAmountString(armyType, amount) : undefined
		})
		.filter((o): o is string => Boolean(o))
		.join('  ')
}
