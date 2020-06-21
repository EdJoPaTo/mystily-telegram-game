import {Context} from '../context'
import {costResourcesPart } from './resource'
import {EMOJI} from './emoji'
import {formatPercentage} from './format-number'
import {PlayerUnitArmyType, BASE_ATTACK, BASE_HEALTH, BLOCK_CHANCE, WEAPON_TYPES, UNIT_COST} from '../model'
import {wikidataInfoHeader} from './generals'

export async function generateUnitDetailsPart(ctx: Context, armyType: PlayerUnitArmyType, amount: number): Promise<string> {
	const reader = await ctx.wd.reader(`army.${armyType}`)
	const attack = BASE_ATTACK[armyType]
	const block = BLOCK_CHANCE[armyType]
	const health = BASE_HEALTH[armyType]

	let text = ''
	text += wikidataInfoHeader(reader, {titlePrefix: `${amount}x ${EMOJI[armyType]}`})

	text += '\n'
	text +=	attack.strength
	text += EMOJI[attack.type]
	text += '  '
	text += health
	text += EMOJI.health

	text += '\n'
	text += WEAPON_TYPES
		.map(o => `${formatPercentage(block[o])}${EMOJI.defence}${EMOJI[o]}`)
		.join('  ')

	return text
}

export async function generateUnitDetailsAndCostPart(ctx: Context, armyType: PlayerUnitArmyType): Promise<string> {
	const detailsPart = await generateUnitDetailsPart(ctx, armyType, ctx.session.units[armyType])
	const costPart = await costResourcesPart(ctx, UNIT_COST[armyType], ctx.session.resources)
	return detailsPart + '\n' + costPart
}

export async function recruitButtonText(ctx: Context, armyType: PlayerUnitArmyType): Promise<string> {
	const readerArmy = await ctx.wd.reader('army.' + armyType)
	const readerRecruit = await ctx.wd.reader('action.recruit')
	return EMOJI.recruit + readerRecruit.label() + ' ' + EMOJI[armyType] + readerArmy.label()
}
