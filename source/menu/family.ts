import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context, Session} from '../lib/context'
import {getRaw} from '../lib/user-sessions'

import {backButtons} from '../lib/interface/menu'
import {randomFamilyEmoji, EMOJI} from '../lib/interface/emoji'

function getFamilyMembers(lastName: string): Session[] {
	return getRaw()
		.map(o => o.data)
		.filter(o => o.name?.last === lastName)
}

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''

	text += randomFamilyEmoji()
	text += ' '
	text += '*'
	text += ctx.session.name!.last!
	text += '*'

	if (ctx.session.name?.last) {
		const familyMembers = getFamilyMembers(ctx.session.name.last)

		const lines = familyMembers
			.sort((a, b) => a.buildings.townhall - b.buildings.townhall)
			.map(o => `${o.buildings.townhall}${EMOJI.townhall} ${o.name!.first}`)

		text += '\n\n'
		text += lines.join('\n')
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.manualRow(backButtons)
