import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/context'
import {getCurrentMystic} from '../../mystics-attacking'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {wikidataInfoHeader} from '../../lib/interface/generals'

async function menuBody(ctx: Context): Promise<Body> {
	const {qNumber, remainingHealth, maxHealth} = await getCurrentMystic()
	const reader = await ctx.wd.reader(qNumber)
	const images = reader.images(800)

	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('menu.mystic'), {titlePrefix: EMOJI.mystic})
	text += '\n\n'
	text += wikidataInfoHeader(reader)
	text += '\n\n'

	text += Math.round(Math.max(1, remainingHealth))
	text += EMOJI.health
	text += ' / '
	text += Math.round(maxHealth)
	text += EMOJI.health

	return {text, parse_mode: 'Markdown', media: images[0], type: 'photo'}
}

export const menu = new MenuTemplate(menuBody)

menu.url(
	async ctx => `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()} ${(await ctx.wd.reader('menu.mystic')).label()}`,
	async ctx => (await ctx.wd.reader('menu.mystic')).url()
)

menu.url(async ctx => {
	const {qNumber} = await getCurrentMystic()
	return `ℹ️ ${(await ctx.wd.reader('menu.wikidataItem')).label()} ${(await ctx.wd.reader(qNumber)).label()}`
}, async ctx => {
	const {qNumber} = await getCurrentMystic()
	return (await ctx.wd.reader(qNumber)).url()
})

menu.manualRow(backButtons)
