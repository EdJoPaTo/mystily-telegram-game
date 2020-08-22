import {MenuTemplate, Body} from 'telegraf-inline-menu'
import arrayFilterUnique from 'array-filter-unique'

import {calcBuildingCost} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'
import * as wdSets from '../../../lib/wikidata-sets'

import {backButtons} from '../../../lib/interface/menu'
import {infoHeader} from '../../../lib/interface/construction'
import {upgradeResourcesPart} from '../../../lib/interface/resource'

import {constructionFromContext, addUpgradeButton} from './generic-helper'

export const menu = new MenuTemplate<Context>(constructionBody)

async function constructionBody(context: Context, path: string): Promise<Body> {
	const {level} = constructionFromContext(context, path)

	const textParts: string[] = []
	textParts.push(await infoHeader(context, 'spyForest', level))

	const currentAmount = context.session.spies.length
	const maxAmount = level
	textParts.push(`${currentAmount} / ${maxAmount}`)

	textParts.push(await currentSpiesPart(context))

	const requiredResources = calcBuildingCost('spyForest', level)
	const currentResources = context.session.resources
	textParts.push(await upgradeResourcesPart(context, requiredResources, currentResources))

	const text = textParts.join('\n\n')

	return {text, parse_mode: 'Markdown'}
}

async function currentSpiesPart(context: Context): Promise<string> {
	const currentSpies = context.session.spies
		.filter(arrayFilterUnique())
	await context.wd.preload(currentSpies)
	const infos = await Promise.all(currentSpies.map(async o => spyInfo(context, o)))
	return infos
		.map(o => `${o.emoji} ${o.label}: ${o.amount}`)
		.join('\n')
}

async function spyInfo(context: Context, spy: string): Promise<Readonly<{label: string; emoji: string; amount: number}>> {
	const reader = await context.wd.reader(spy)
	const amount = context.session.spies.filter(o => o === spy).length
	const emoji = reader.unicodeChars()[0]
	const label = reader.label()
	return {amount, emoji, label}
}

menu.interact('add', 'add', {
	hide: (context, path) => {
		const {level} = constructionFromContext(context, path)
		const currentAmount = context.session.spies.length
		return currentAmount >= level
	},
	do: async context => {
		// TODO: get spy (catch? tame? dice via question?)
		context.session.spies.push(wdSets.getRandom('spies'))
		return true
	}
})

// TODO: release submenu
// TODO: Release a spy -> a random player gets this spy (ignoring the building limit!)
menu.interact('remove all', 'remove', {
	do: async context => {
		context.session.spies = []
		return true
	}
})

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.spyForest'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
