import {MenuTemplate} from 'telegraf-inline-menu'

import {Building, calcBuildingCost, changeBuildingLevel, calcCurrentBuildingAmount, calcMaxBuildingAmount, Buildings} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'
import {EMOJI} from '../../../lib/interface/emoji'
import {Resources} from '../../../lib/model/resources'
import * as resourceMath from '../../../lib/model/resource-math'

export function canUpgrade(buildings: Buildings, building: Building, currentResources: Resources): boolean {
	const requiredResources = calcBuildingCost(building, buildings[building])
	const enoughResources = resourceMath.isEnough(currentResources, requiredResources)

	const hasPlaceForAnotherBuilding = canBuildAnotherBuilding(buildings, building)

	return enoughResources && hasPlaceForAnotherBuilding
}

export function canBuildAnotherBuilding(buildings: Buildings, building: Building): boolean {
	if (building === 'townhall') {
		return true
	}

	const currentBuildings = calcCurrentBuildingAmount(buildings)
	const maxBuildings = calcMaxBuildingAmount(buildings.townhall)
	return currentBuildings < maxBuildings
}

export function constructionFromContext(ctx: Context, path: string): Readonly<{building: Building; level: number}> {
	const building = path.split('/')[2].split(':').slice(-1)[0] as Building
	const level = ctx.session.buildings[building]
	return {building, level}
}

export function addUpgradeButton(menu: MenuTemplate<Context>): void {
	menu.interact(async ctx => `⬆️ ${(await ctx.wd.reader('action.upgrade')).label()}`, 'upgrade', {
		do: async (ctx, path) => {
			const {building, level} = constructionFromContext(ctx, path)
			const requiredResources = calcBuildingCost(building, level)

			if (!canBuildAnotherBuilding(ctx.session.buildings, building)) {
				const townhallReader = await ctx.wd.reader('construction.townhall')
				await ctx.answerCbQuery(EMOJI.missing + EMOJI.townhall + townhallReader.label())
				return false
			}

			const missingResources = resourceMath.getKindsOfMissingResources(ctx.session.resources, requiredResources)
			if (missingResources.length > 0) {
				await ctx.answerCbQuery(EMOJI.missing + missingResources.map(resource => EMOJI[resource]).join(''))
				return true
			}

			ctx.session.resources = resourceMath.subtract(ctx.session.resources, requiredResources)
			ctx.session.buildings = changeBuildingLevel(ctx.session.buildings, building, before => before + 1)

			return true
		}
	})

	menu.interact(async ctx => `⬇️ ${(await ctx.wd.reader('action.deconstruct')).label()}`, 'deconstruct', {
		joinLastRow: true,
		hide: (ctx, path) => constructionFromContext(ctx, path).level === 0,
		do: (ctx, path) => {
			const {building} = constructionFromContext(ctx, path)
			ctx.session.buildings = changeBuildingLevel(ctx.session.buildings, building, before => before - 1)
			return '.'
		}
	})
}
