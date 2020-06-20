import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Building, calcBuildingCost, calcResourceIncomeFromBuilding, RESOURCES} from '../lib/model'
import {Context} from '../lib/context'
import * as resourceMath from '../lib/model/resource-math'

import {backButtons} from '../lib/interface/menu'
import {upgradeResourcesPart, incomeResourcesPart} from '../lib/interface/resource'
import {infoHeader, constructionPropertyString} from '../lib/interface/construction'

export const menu = new MenuTemplate<Context>(constructionBody)

function constructionFromCtx(ctx: Context, path: string): Readonly<{building: Building; level: number}> {
	const building = path.split('/')[2].split(':').slice(-1)[0] as Building
	const level = ctx.session.buildings[building]
	return {building, level}
}

async function constructionBody(ctx: Context, path: string): Promise<Body> {
	const {building, level} = constructionFromCtx(ctx, path)

	const requiredResources = calcBuildingCost(building, level)
	const currentResources = ctx.session.resources
	const income = calcResourceIncomeFromBuilding(building, level)

	const textParts: string[] = []
	textParts.push(await infoHeader(ctx, building, level))

	const properties = await constructionPropertyString(ctx, ctx.session.buildings, building)
	if (properties) {
		textParts.push(properties)
	}

	if (RESOURCES.some(r => income[r] > 0)) {
		textParts.push(await incomeResourcesPart(ctx, calcResourceIncomeFromBuilding(building, level)))
	}

	textParts.push(await upgradeResourcesPart(ctx, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

menu.interact(async ctx => `⬆️ ${(await ctx.wd.reader('action.upgrade')).label()}`, 'upgrade', {
	hide: (ctx, path) => {
		const {building, level} = constructionFromCtx(ctx, path)
		const requiredResources = calcBuildingCost(building, level)
		const currentResources = ctx.session.resources
		return !resourceMath.isEnough(currentResources, requiredResources)
	},
	do: (ctx, path) => {
		const {building, level} = constructionFromCtx(ctx, path)
		const requiredResources = calcBuildingCost(building, level)

		ctx.session.resources = resourceMath.subtract(ctx.session.resources, requiredResources)
		ctx.session.buildings = {
			...ctx.session.buildings,
			[building]: level + 1
		}

		return '.'
	}
})

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async (ctx, path) => {
	const {building} = constructionFromCtx(ctx, path)
	const wdKey = `construction.${building}`
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
