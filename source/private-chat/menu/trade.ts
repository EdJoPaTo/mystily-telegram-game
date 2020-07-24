import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcStorageCapacity} from '../../lib/model/buildings'
import {Context} from '../../lib/context'

import {backButtons} from '../../lib/interface/menu'
import {currentResourcesPart} from '../../lib/interface/resource'
import {EMOJI} from '../../lib/interface/emoji'
import {wikidataInfoHeader} from '../../lib/interface/generals'

async function tradeMenuBody(ctx: Context): Promise<Body> {
	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('action.buy'), {titlePrefix: EMOJI.trade})
	text += '\n\n'
	text += await currentResourcesPart(ctx, ctx.session.resources, calcStorageCapacity(ctx.session.buildings.storage))
	text += '\n\n'
	text += 'Lazy dev… Nothing here yet…'
	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate(tradeMenuBody)

menu.manualRow(backButtons)
