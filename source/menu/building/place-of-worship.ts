import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcUnitSum, UNIT_COST} from '../../lib/model/units'
import {calcBarracksMaxPeople, calcBuildingCost} from '../../lib/model/buildings'
import {Context} from '../../lib/context'
import * as resourceMath from '../../lib/model/resource-math'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {recruitButtonText, generateUnitDetailsAndCostPart} from '../../lib/interface/army'
import {infoHeader} from '../../lib/interface/construction'
import {upgradeResourcesPart} from '../../lib/interface/resource'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {level} = constructionFromCtx(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, 'placeOfWorship', level))

	const currentAmount = calcUnitSum(ctx.session.units)
	const maxAmount = calcBarracksMaxPeople(ctx.session.buildings.barracks)
	textParts.push(`${currentAmount}${EMOJI.army} / ${maxAmount}${EMOJI.army}`)

	textParts.push(await generateUnitDetailsAndCostPart(ctx, 'cleric'))

	const requiredResources = calcBuildingCost('placeOfWorship', level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

menu.interact(async ctx => recruitButtonText(ctx, 'cleric'), 'recruit', {
	hide: ctx => !canRecruit(ctx),
	do: ctx => {
		ctx.session.resources = resourceMath.subtract(ctx.session.resources, UNIT_COST.cleric)

		ctx.session.units = {
			...ctx.session.units,
			cleric: ctx.session.units.cleric + 1
		}

		return '.'
	}
})

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.placeOfWorship'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)

function canRecruit(ctx: Context): boolean {
	if (calcUnitSum(ctx.session.units) >= calcBarracksMaxPeople(ctx.session.buildings.barracks)) {
		return false
	}

	if (ctx.session.units.cleric >= ctx.session.buildings.placeOfWorship) {
		return false
	}

	return resourceMath.isEnough(ctx.session.resources, UNIT_COST.cleric)
}
