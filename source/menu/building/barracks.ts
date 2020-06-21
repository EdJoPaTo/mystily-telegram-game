import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcBuildingCost, calcBarracksMaxPeople, calcArmyUnitSum, PLAYER_ATTACKING_UNITS, PlayerUnitArmyType, UNIT_COST} from '../../lib/model'
import {Context} from '../../lib/context'
import * as resourceMath from '../../lib/model/resource-math'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {generateUnitDetailsPart} from '../../lib/interface/army'
import {infoHeader} from '../../lib/interface/construction'
import {upgradeResourcesPart, costResourcesPart} from '../../lib/interface/resource'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {level} = constructionFromCtx(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, 'barracks', level))

	const currentAmount = calcArmyUnitSum(ctx.session.units)
	const maxAmount = calcBarracksMaxPeople(ctx.session.buildings.barracks)
	textParts.push(`${currentAmount}${EMOJI.army} / ${maxAmount}${EMOJI.army}`)

	textParts.push(...await Promise.all(
		PLAYER_ATTACKING_UNITS.map(async o => unitPart(ctx, o))
	))

	const requiredResources = calcBuildingCost('barracks', level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

menu.choose('recruit', canRecruitOptions, {
	columns: 1,
	hide: ctx => calcArmyUnitSum(ctx.session.units) >= calcBarracksMaxPeople(ctx.session.buildings.barracks),
	buttonText: async (ctx, key) => {
		const armyType = key as PlayerUnitArmyType
		const readerArmy = await ctx.wd.reader('army.' + armyType)
		const readerRecruit = await ctx.wd.reader('action.recruit')
		return EMOJI.recruit + readerRecruit.label() + ' ' + EMOJI[armyType] + readerArmy.label()
	},
	do: (ctx, key) => {
		const armyType = key as PlayerUnitArmyType
		const cost = UNIT_COST[armyType]

		ctx.session.resources = resourceMath.subtract(ctx.session.resources, cost)

		ctx.session.units = {
			...ctx.session.units,
			[armyType]: ctx.session.units[armyType] + 1
		}

		return '.'
	}
})

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.barracks'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)

async function unitPart(ctx: Context, armyType: PlayerUnitArmyType): Promise<string> {
	const detailsPart = await generateUnitDetailsPart(ctx, armyType, ctx.session.units[armyType])
	const costPart = await costResourcesPart(ctx, UNIT_COST[armyType], ctx.session.resources)
	return detailsPart + '\n' + costPart
}

async function canRecruitOptions(ctx: Context): Promise<readonly string[]> {
	const canBeRecruited: string[] = []
	const currentResources = ctx.session.resources

	for (const armyType of PLAYER_ATTACKING_UNITS) {
		const cost = UNIT_COST[armyType]
		if (resourceMath.isEnough(currentResources, cost)) {
			canBeRecruited.push(armyType)
		}
	}

	return canBeRecruited
}
