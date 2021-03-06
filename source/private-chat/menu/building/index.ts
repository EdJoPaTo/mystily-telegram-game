import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Building, BUILDINGS, calcMaxBuildingAmount, calcCurrentBuildingAmount} from '../../../lib/model/buildings'
import {Context} from '../../../lib/context'

import {backButtons, wdButtonText} from '../../../lib/interface/menu'
import {constructionLine} from '../../../lib/interface/construction'
import {EMOJI} from '../../../lib/interface/emoji'
import {wikidataInfoHeader} from '../../../lib/interface/generals'

import {canUpgrade} from './generic-helper'
import {menu as barracksMenu} from './barracks'
import {menu as entryMenu} from './generic-building'
import {menu as placeOfWorshipMenu} from './place-of-worship'
import {menu as spyForestMenu} from './spy-forest'
import {menu as wallMenu} from './wall'

async function constructionMenuBody(ctx: Context): Promise<Body> {
	const currentResources = ctx.session.resources
	const {buildings} = ctx.session

	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('menu.buildings'), {
		titlePrefix: EMOJI.buildings,
		titleSuffix: `(${calcCurrentBuildingAmount(buildings)} / ${calcMaxBuildingAmount(buildings.townhall)})`
	})

	text += '\n\n'

	const constructionLines = await Promise.all(BUILDINGS
		.map(async o => constructionLine(ctx, o, buildings[o], canUpgrade(buildings, o, currentResources)))
	)
	text += constructionLines.join('\n')

	return {text, parse_mode: 'Markdown'}
}

async function constructionButtonTextFunc(ctx: Context, key: string): Promise<string> {
	const wdKey = `construction.${key}`
	return `${EMOJI[key as Building]} ${(await ctx.wd.reader(wdKey)).label()}`
}

export const menu = new MenuTemplate<Context>(constructionMenuBody)

menu.submenu(wdButtonText(EMOJI.townhall, 'construction.townhall'), 'townhall', entryMenu)

menu.submenu(wdButtonText(EMOJI.marketplace, 'construction.marketplace'), 'marketplace', entryMenu)
menu.submenu(wdButtonText(EMOJI.storage, 'construction.storage'), 'storage', entryMenu, {joinLastRow: true})

menu.chooseIntoSubmenu('', ['sawmill', 'loampit', 'quarry', 'mine'], entryMenu, {
	columns: 2,
	buttonText: constructionButtonTextFunc
})

menu.submenu(wdButtonText(EMOJI.farm, 'construction.farm'), 'farm', entryMenu)

menu.submenu(wdButtonText(EMOJI.barracks, 'construction.barracks'), 'barracks', barracksMenu)
menu.submenu(wdButtonText(EMOJI.wall, 'construction.wall'), 'wall', wallMenu, {joinLastRow: true})

menu.submenu(wdButtonText(EMOJI.spyForest, 'construction.spyForest'), 'spyForest', spyForestMenu)
menu.submenu(wdButtonText(EMOJI.placeOfWorship, 'construction.placeOfWorship'), 'placeOfWorship', placeOfWorshipMenu, {joinLastRow: true})

menu.manualRow(backButtons)
