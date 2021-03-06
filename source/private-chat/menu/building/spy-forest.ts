import {MenuTemplate, Body} from 'telegraf-inline-menu'
import arrayFilterUnique from 'array-filter-unique'

import {calcBuildingCost} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'
import {updateSession} from '../../../lib/session-state-math'
import * as userSessions from '../../../lib/user-sessions'
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
		const now = Date.now() / 1000
		const {level} = constructionFromContext(context, path)

		const isCurrentlyAttacking = Boolean(context.session.attackTime && context.session.attackTime > now)

		const currentAmount = context.session.spies.length
		const hasMaxSpies = currentAmount >= level

		return isCurrentlyAttacking || hasMaxSpies
	},
	do: async context => {
		// TODO: get spy (catch? tame? dice via question?)
		context.session.spies.push(wdSets.getRandom('spies'))
		return true
	}
})

const removeMenu = new MenuTemplate(constructionBody)

function removeChoices(context: Context): string[] {
	return context.session.spies.filter(arrayFilterUnique())
}

removeMenu.choose('', removeChoices, {
	columns: 4,
	buttonText: async (context, key) => {
		const reader = await context.wd.reader(key)
		const emoji = reader.unicodeChars()[0]
		return '-1 ' + emoji
	},
	do: async (context, key) => {
		const now = Date.now() / 1000
		const index = context.session.spies.lastIndexOf(key)
		const releasedSpies = context.session.spies.splice(index, 1)

		const receiver = userSessions.getRandomUser(o => o.user !== context.from!.id && !o.data.blocked)
		if (receiver) {
			updateSession(receiver.data, now)
			receiver.data.spies.push(...releasedSpies)
			const receiverLanguage = receiver.data.__wikibase_language_code ?? 'en'

			const strayReader = await context.wd.reader('other.stray', receiverLanguage)
			const spyReader = await context.wd.reader(releasedSpies[0], receiverLanguage)

			let text = ''
			text += strayReader.label()
			text += '\n'
			text += '+1'
			text += ' '
			text += spyReader.unicodeChars()[0]

			try {
				await context.telegram.sendMessage(receiver.user, text)
			} catch (error) {
				console.error('send got wandering spy failed', receiver.user, error.message)
				receiver.data.blocked = true
			}
		}

		return true
	}
})

removeMenu.manualRow(backButtons)

menu.submenu('remove', 'remove', removeMenu, {
	joinLastRow: true,
	hide: context => context.session.spies.length === 0
})

addUpgradeButton(menu)

menu.url(async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`, async ctx => {
	const wdKey = 'construction.spyForest'
	const reader = await ctx.wd.reader(wdKey)
	return reader.url()
})

menu.manualRow(backButtons)
