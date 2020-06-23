import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcResourceIncomeFromBuilding, calcBuildingCost} from '../../lib/model/buildings'
import {Context} from '../../lib/context'
import {RESOURCES} from '../../lib/model/resources'

import {backButtons} from '../../lib/interface/menu'
import {upgradeResourcesPart, incomeResourcesPart} from '../../lib/interface/resource'
import {infoHeader, constructionPropertyString} from '../../lib/interface/construction'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {building, level} = constructionFromCtx(ctx, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, building, level))

	const properties = await constructionPropertyString(ctx, ctx.session.buildings, building)
	if (properties) {
		textParts.push(properties)
	}

	const income = calcResourceIncomeFromBuilding(building, level)
	if (RESOURCES.some(r => income[r] > 0)) {
		textParts.push(await incomeResourcesPart(ctx, calcResourceIncomeFromBuilding(building, level)))
	}

	const requiredResources = calcBuildingCost(building, level)
	const currentResources = ctx.session.resources
	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async (ctx, path) => {
	const {building} = constructionFromCtx(ctx, path)
	const wdKey = `construction.${building}`
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
