import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/context'

import {backButtons} from '../../../lib/interface/menu'
import {EMOJI} from '../../../lib/interface/emoji'
import {formatNamePlain} from '../../../lib/interface/name'

import {menu as firstMenu} from './first'
import {menu as lastMenu} from './last'

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''

	text += EMOJI.name
	text += ' '
	text += '*'
	text += ctx.i18n.t('name.question.full')
	text += '*'

	text += '\n\n'
	text += ctx.i18n.t('name.info.full').trim()

	if (ctx.session.name) {
		text += '\n\n'
		text += await ctx.wd.reader('menu.name').then(r => r.label())
		text += ': '
		text += formatNamePlain(ctx.session.name)
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.submenu(ctx => ctx.session.name?.first ?? EMOJI.nameFallback, 'first', firstMenu)

menu.submenu(ctx => ctx.session.name?.last ?? EMOJI.nameFallback, 'last', lastMenu, {
	joinLastRow: true,
	hide: ctx => !ctx.session.name
})

menu.manualRow(backButtons)
