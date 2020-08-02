import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcBuildingCost} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'

import {backButtons} from '../../../lib/interface/menu'
import {generateUnitDetailsPart} from '../../../lib/interface/units'
import {infoHeader} from '../../../lib/interface/construction'
import {upgradeResourcesPart} from '../../../lib/interface/resource'

import {constructionFromContext, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {level} = constructionFromContext(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, 'placeOfWorship', level))

	textParts.push(await generateUnitDetailsPart(ctx, 'cleric', level * 2))

	const requiredResources = calcBuildingCost('placeOfWorship', level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.placeOfWorship'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
