import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../lib/context'
import {getCurrentMystical} from '../mystics-attacking'

import {backButtons} from '../lib/interface/menu'
import {EMOJI} from '../lib/interface/emoji'
import {formatNumberShort} from '../lib/interface/format-number'
import {wikidataInfoHeader} from '../lib/interface/generals'

async function menuBody(ctx: Context): Promise<Body> {
	const {qNumber, current, max, gold} = getCurrentMystical()
	const reader = await ctx.wd.reader(qNumber)
	const images = reader.images(800)

	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('menu.mystical'), {titlePrefix: EMOJI.mystical})
	text += '\n\n'
	text += wikidataInfoHeader(reader)
	text += '\n\n'

	text += Math.round(Math.max(1, current))
	text += EMOJI.health
	text += ' / '
	text += Math.round(max)
	text += EMOJI.health

	text += '\n'
	text += formatNumberShort(gold, true)
	// Text += EMOJI.gold

	return {text, parse_mode: 'Markdown', media: images[0], type: 'photo'}
}

export const menu = new MenuTemplate(menuBody)

menu.url(
	async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()} ${(await ctx.wd.reader('menu.mystical')).label()}`,
	async ctx => (await ctx.wd.reader('menu.mystical')).url()
)

menu.url(async ctx => {
	const {qNumber} = getCurrentMystical()
	return `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()} ${(await ctx.wd.reader(qNumber)).label()}`
}, async ctx => {
	const {qNumber} = getCurrentMystical()
	return (await ctx.wd.reader(qNumber)).url()
})

menu.manualRow(backButtons)
