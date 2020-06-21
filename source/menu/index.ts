import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {BUILDINGS, calcResourceIncomeFromBuilding, calcStorageCapacity} from '../lib/model'
import {Context} from '../lib/context'
import * as resourceMath from '../lib/model/resource-math'

import {EMOJI, randomFamilyEmoji} from '../lib/interface/emoji'
import {formatNamePlain} from '../lib/interface/name'
import {currentResourcesPart, incomeResourcesPart} from '../lib/interface/resource'
import {wikidataInfoHeader} from '../lib/interface/generals'

import {menu as buildingsMenu} from './building'
import {menu as familyMenu} from './family'
import {menu as languageMenu} from './languages'
import {menu as mysticsMenu} from './mystic'
import {menu as nameMenu} from './name'
import {menu as spyMenu} from './spy'
import {menu as statsMenu} from './stats'
import {menu as tradeMenu} from './trade'
import {menu as warMenu} from './war'

async function menuBody(ctx: Context): Promise<Body> {
	const textParts: string[] = []

	textParts.push(wikidataInfoHeader(await ctx.wd.reader('menu.menu')))

	if (ctx.session.name) {
		textParts.push(`${EMOJI.name} ${formatNamePlain(ctx.session.name)}`)
	}

	textParts.push(await currentResourcesPart(ctx, ctx.session.resources, calcStorageCapacity(ctx.session.buildings.storage)))

	textParts.push(await incomeResourcesPart(ctx, resourceMath.sum(...BUILDINGS.map(building => calcResourceIncomeFromBuilding(building, ctx.session.buildings[building])))))

	textParts.push(ctx.i18n.t('disclaimer'))

	return {text: textParts.join('\n\n'), parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate(menuBody)

function buttonText(emoji: string, resourceKey: string): (ctx: Context) => Promise<string> {
	return async ctx => `${emoji} ${(await ctx.wd.reader(resourceKey)).label()}`
}

menu.submenu(buttonText(EMOJI.buildings, 'menu.buildings'), 'b', buildingsMenu)

menu.submenu(buttonText(EMOJI.name, 'menu.name'), 'name', nameMenu)

menu.submenu(buttonText(randomFamilyEmoji(), 'menu.family'), 'family', familyMenu, {
	joinLastRow: true,
	hide: ctx => !ctx.session.name?.last
})

menu.submenu(buttonText(EMOJI.war, 'menu.war'), 'war', warMenu, {
	hide: ctx => !ctx.session.name || ctx.session.buildings.barracks === 0
})

menu.submenu(buttonText(EMOJI.trade, 'menu.trade'), 'trade', tradeMenu, {
	joinLastRow: true,
	hide: ctx => !ctx.session.name || ctx.session.buildings.marketplace === 0
})

menu.submenu(buttonText(EMOJI.mystic, 'menu.mystical'), 'mystic', mysticsMenu, {
	hide: ctx => !ctx.session.name
})

menu.submenu(buttonText(EMOJI.search, 'menu.spy'), 'spy', spyMenu, {
	joinLastRow: true,
	hide: ctx => !ctx.session.name
})

menu.submenu(buttonText(EMOJI.language, 'menu.language'), 'lang', languageMenu)

menu.submenu(buttonText(EMOJI.statistics, 'menu.statistics'), 'stats', statsMenu, {
	joinLastRow: true
})

menu.url(buttonText(EMOJI.chat, 'menu.chat'), 'https://t.me/Mystily')
