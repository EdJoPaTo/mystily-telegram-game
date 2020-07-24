import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcUnitSum, PLAYER_BARRACKS_ARMY_TYPES, BarracksArmyType, UNIT_COST, ZERO_BARRACKS_UNITS} from '../../../lib/model/units'
import {calcBarracksMaxPeople, calcBuildingCost} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'
import * as resourceMath from '../../../lib/model/resource-math'

import {backButtons} from '../../../lib/interface/menu'
import {EMOJI} from '../../../lib/interface/emoji'
import {generateUnitDetailsAndCostPart} from '../../../lib/interface/units'
import {infoHeader} from '../../../lib/interface/construction'
import {upgradeResourcesPart} from '../../../lib/interface/resource'

import {constructionFromCtx, addUpgradeButton} from './generic-helper'

const NUMERIC_ADD_BUTTONS: readonly number[] = [1, 5, 25]

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

for (const armyType of PLAYER_BARRACKS_ARMY_TYPES) {
	menu.choose(armyType, createRecruitOptionsFunction(armyType), {
		columns: 6,
		do: createRecruitDoFunction(armyType)
	})
}

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.barracks'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)

function createRecruitOptionsFunction(armyType: BarracksArmyType): (context: Context) => Record<string, string> {
	return context => {
		const freeSpots = calcBarracksMaxPeople(context.session.buildings.barracks) - calcUnitSum(context.session.barracksUnits)
		if (freeSpots <= 0) {
			return {}
		}

		const enoughResourceFor = resourceMath.enoughFor(context.session.resources, UNIT_COST[armyType])
		const canRecruit = Math.max(0, Math.min(freeSpots, enoughResourceFor))

		const result: Record<string, string> = {}

		for (const amount of NUMERIC_ADD_BUTTONS) {
			if (canRecruit > amount) {
				result[amount] = `+${amount} ${EMOJI[armyType]}`
			}
		}

		result.max = `+${canRecruit} ${EMOJI[armyType]}`

		return result
	}
}

function createRecruitDoFunction(armyType: BarracksArmyType): (context: Context, key: string) => true {
	return (context, key) => {
		const wantedAmount = key === 'max' ? Infinity : Number(key)

		const freeSpots = calcBarracksMaxPeople(context.session.buildings.barracks) - calcUnitSum(context.session.barracksUnits)
		const enoughResourceFor = resourceMath.enoughFor(context.session.resources, UNIT_COST[armyType])
		const canRecruit = Math.max(0, Math.min(freeSpots, enoughResourceFor))

		const amount = Math.min(wantedAmount, canRecruit)

		const raw: number | undefined = context.session.barracksUnits[armyType]
		const currentAmount = Number.isFinite(raw) ? raw : 0

		const totalCost = resourceMath.multiply(UNIT_COST[armyType], amount)
		context.session.resources = resourceMath.subtract(context.session.resources, totalCost)

		context.session.barracksUnits = {
			...ZERO_BARRACKS_UNITS,
			...context.session.barracksUnits,
			[armyType]: currentAmount + amount
		}

		return true
	}
}
