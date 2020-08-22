import {markdown as format} from 'telegram-format/dist/source'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {UNISEX, FAMILY, FEMALE, MALE} from 'wikidata-person-names'

import {BUILDINGS} from '../../lib/model/buildings'
import {Context, Session, Name} from '../../lib/context'
import {PLAYER_BARRACKS_ARMY_TYPES} from '../../lib/model/units'
import * as userSessions from '../../lib/user-sessions'
import * as wdSets from '../../lib/wikidata-sets'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {formatNamePlain} from '../../lib/interface/name'
import {formatNumberShort} from '../../lib/interface/format-number'
import {wikidataInfoHeader} from '../../lib/interface/generals'
import WikidataEntityReader from 'wikidata-entity-reader/dist/source'

function playersWithMaximum(sessions: ReadonlyArray<Readonly<Session>>, map: (session: Readonly<Session>) => number): Readonly<{amount: number; names: readonly Name[]}> {
	let amount = 0
	let names: Name[] = []

	for (const entry of sessions) {
		if (!entry.name) {
			continue
		}

		const entryAmount = map(entry)
		if (entryAmount > amount) {
			amount = entryAmount
			names = [entry.name]
		} else if (entryAmount === amount) {
			names.push(entry.name)
		}
	}

	return {amount, names}
}

function topLine(emoji: string, reader: WikidataEntityReader, amount: number, names: readonly Name[]): string {
	let text = ''
	text += emoji
	text += ' '
	text += format.bold(reader.label())
	text += ' '
	text += format.italic(
		(names.length > 3 ? '≤' : '') + String(amount)
	)

	if (names.length <= 3) {
		text += ': '
		text += names.map(name => formatNamePlain(name)).join(', ')
	}

	return text
}

async function topLevelBuildingsPart(ctx: Context, sessions: ReadonlyArray<Readonly<Session>>): Promise<string> {
	const lines = await Promise.all(BUILDINGS
		.map(async building => {
			const {amount, names} = playersWithMaximum(sessions, o => o.buildings[building])
			const reader = await ctx.wd.reader(`construction.${building}`)
			return topLine(EMOJI[building], reader, amount, names)
		})
	)

	return lines
		.filter((o): o is string => Boolean(o))
		.join('\n')
}

async function topUnitPart(ctx: Context, sessions: ReadonlyArray<Readonly<Session>>): Promise<string> {
	const lines = await Promise.all(PLAYER_BARRACKS_ARMY_TYPES
		.map(async armyType => {
			const {amount, names} = playersWithMaximum(sessions, o => o.barracksUnits[armyType])
			if (amount < 10) {
				return undefined
			}

			const reader = await ctx.wd.reader(`army.${armyType}`)
			return topLine(EMOJI[armyType], reader, amount, names)
		})
	)

	return lines
		.filter((o): o is string => Boolean(o))
		.join('\n')
}

async function simpleStat(ctx: Context, wikidataResourceKey: string, amount: number): Promise<string> {
	const reader = await ctx.wd.reader(wikidataResourceKey)
	return `${reader.label()}: ${formatNumberShort(amount, true)}`
}

async function menuBody(ctx: Context): Promise<Body> {
	const allSessions = userSessions.getRaw()
	const allSessionData = allSessions.map(o => o.data)

	let text = ''
	const reader = await ctx.wd.reader('stat.stats')
	text += wikidataInfoHeader(reader, {titlePrefix: EMOJI.statistics})
	text += '\n\n'

	const parts: string[] = []

	const statLines: string[] = []
	statLines.push(`${(await ctx.wd.reader('stat.player')).label()}: ${allSessions.length} (${allSessionData.filter(o => !o.blocked && o.name).length} ${EMOJI.activeUser})`)
	parts.push(statLines.join('\n'))

	const wikidataItems: string[] = []
	wikidataItems.push(format.bold((await ctx.wd.reader('menu.wikidataItem')).label()))
	wikidataItems.push(await simpleStat(ctx, 'menu.mystic', wdSets.get('mystics').length))
	wikidataItems.push(await simpleStat(ctx, 'menu.spy', wdSets.get('spies').length))
	wikidataItems.push(await simpleStat(ctx, 'stat.name.female', FEMALE.length))
	wikidataItems.push(await simpleStat(ctx, 'stat.name.unisex', UNISEX.length))
	wikidataItems.push(await simpleStat(ctx, 'stat.name.male', MALE.length))
	wikidataItems.push(await simpleStat(ctx, 'stat.name.family', FAMILY.length))
	parts.push(wikidataItems.join('\n'))

	parts.push(await topLevelBuildingsPart(ctx, allSessionData))
	parts.push(await topUnitPart(ctx, allSessionData))

	text += parts.map(o => o.trim()).filter(o => o).join('\n\n')
	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate(menuBody)

menu.url(
	async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()}`,
	async ctx => (await ctx.wd.reader('stat.stats')).url()
)

menu.manualRow(backButtons)
