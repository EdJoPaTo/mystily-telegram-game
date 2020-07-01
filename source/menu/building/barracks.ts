import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcUnitSum, PLAYER_BARRACKS_ARMY_TYPES, BarracksArmyType, UNIT_COST} from '../../lib/model/units'
import {calcBarracksMaxPeople, calcBuildingCost} from '../../lib/model/buildings'
import {Context} from '../../lib/context'
import * as resourceMath from '../../lib/model/resource-math'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {generateUnitDetailsAndCostPart, recruitButtonText} from '../../lib/interface/units'
import {infoHeader} from '../../lib/interface/construction'
import {upgradeResourcesPart} from '../../lib/interface/resource'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {level} = constructionFromCtx(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, 'barracks', level))

	const currentAmount = calcUnitSum(ctx.session.barracksUnits)
	const maxAmount = calcBarracksMaxPeople(ctx.session.buildings.barracks)
	textParts.push(`${currentAmount}${EMOJI.army} / ${maxAmount}${EMOJI.army}`)

	textParts.push(...await Promise.all(
		PLAYER_BARRACKS_ARMY_TYPES.map(async o => generateUnitDetailsAndCostPart(ctx, o))
	))

	const requiredResources = calcBuildingCost('barracks', level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

menu.choose('recruit', canRecruitOptions, {
	columns: 1,
	hide: ctx => calcUnitSum(ctx.session.barracksUnits) >= calcBarracksMaxPeople(ctx.session.buildings.barracks),
	buttonText: async (ctx, key) => recruitButtonText(ctx, key as BarracksArmyType),
	do: (ctx, key) => {
		const armyType = key as BarracksArmyType
		ctx.session.resources = resourceMath.subtract(ctx.session.resources, UNIT_COST[armyType])

		const raw: number | undefined = ctx.session.barracksUnits[armyType]
		const currentAmount = Number.isFinite(raw) ? raw : 0
		ctx.session.barracksUnits = {
			...ctx.session.barracksUnits,
			[armyType]: currentAmount + 1
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

async function canRecruitOptions(ctx: Context): Promise<readonly string[]> {
	const canBeRecruited: string[] = []
	const currentResources = ctx.session.resources

	for (const armyType of PLAYER_BARRACKS_ARMY_TYPES) {
		const cost = UNIT_COST[armyType]
		if (resourceMath.isEnough(currentResources, cost)) {
			canBeRecruited.push(armyType)
		}
	}

	return canBeRecruited
}
