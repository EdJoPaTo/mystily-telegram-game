import {Building, Buildings, calcStorageCapacity, calcCurrentBuildingAmount, calcMaxBuildingAmount} from '../model/buildings'
import {Context} from '../context'

import {currentResourcesPart} from './resource'
import {EMOJI, possibleEmoji} from './emoji'
import {wikidataInfoHeader} from './generals'

export async function constructionLine(ctx: Context, construction: Building, level: number, canUpgrade: boolean): Promise<string> {
	const reader = await ctx.wd.reader(`construction.${construction}`)
	const parts: string[] = []

	parts.push(possibleEmoji(canUpgrade))
	parts.push(EMOJI[construction])
	parts.push(String(level))
	parts.push(
		`*${reader.label()}*`
	)

	return parts.join(' ')
}

export async function infoHeader(ctx: Context, building: Building, currentLevel: number): Promise<string> {
	const wdKey = `construction.${building}`
	return wikidataInfoHeader(await ctx.wd.reader(wdKey), {titlePrefix: EMOJI[building], titleSuffix: String(currentLevel)})
}

export async function constructionPropertyString(ctx: Context, buildings: Buildings, building: Building): Promise<string | undefined> {
	if (building === 'townhall') {
		const currentBuildings = calcCurrentBuildingAmount(buildings)
		const maxBuildings = calcMaxBuildingAmount(buildings.townhall)

		const buildingReader = await ctx.wd.reader('menu.buildings')

		return `*${buildingReader.label()}*: ${currentBuildings} / *${maxBuildings}*`
	}

	if (building === 'storage') {
		const storageCapacity = calcStorageCapacity(buildings.storage)
		return currentResourcesPart(ctx, ctx.session.resources, storageCapacity)
	}

	if (building === 'marketplace') {
		return 'Lazy dev… Nothing here yet…'
	}

	if (building === 'barracks') {
		throw new Error('has its own menu')
	}

	if (building === 'wall') {
		throw new Error('has its own menu')
	}

	if (building === 'placeOfWorship') {
		throw new Error('has its own menu')
	}

	return undefined
}
