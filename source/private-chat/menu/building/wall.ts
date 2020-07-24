import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcBuildingCost} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'

import {backButtons} from '../../../lib/interface/menu'
import {generateUnitDetailsPart} from '../../../lib/interface/units'
import {infoHeader} from '../../../lib/interface/construction'
import {upgradeResourcesPart} from '../../../lib/interface/resource'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {level} = constructionFromCtx(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, 'wall', level))

	textParts.push(await generateUnitDetailsPart(ctx, 'archer', ctx.session.barracksUnits.archer))
	textParts.push(await generateUnitDetailsPart(ctx, 'wallguard', ctx.session.wallguards))

	const requiredResources = calcBuildingCost('wall', level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

menu.interact('archer -> wallguard without cost or button translation', 'fill', {
	do: ctx => {
		const maxGuards = ctx.session.buildings.wall * 4
		const currentGuards = ctx.session.wallguards
		const openGuardSpots = Math.max(0, maxGuards - currentGuards)
		const currentArchers = Math.max(0, ctx.session.barracksUnits.archer)

		const amount = Math.min(openGuardSpots, currentArchers)

		ctx.session.wallguards += amount
		ctx.session.barracksUnits = {
			...ctx.session.barracksUnits,
			archer: currentArchers - amount
		}

		return true
	}
})

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.wall'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
