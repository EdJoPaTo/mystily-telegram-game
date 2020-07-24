import {MenuTemplate} from 'telegraf-inline-menu'

import {Building, calcBuildingCost, changeBuildingLevel} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'
import * as resourceMath from '../../../lib/model/resource-math'

export function constructionFromCtx(ctx: Context, path: string): Readonly<{building: Building; level: number}> {
	const building = path.split('/')[2].split(':').slice(-1)[0] as Building
	const level = ctx.session.buildings[building]
	return {building, level}
}

export function addUpgradeButton(menu: MenuTemplate<Context>): void {
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
			ctx.session.buildings = changeBuildingLevel(ctx.session.buildings, building, before => before + 1)

			return '.'
		}
	})
}
