import {Extra} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {calcArmyFromPlayerUnits, PLAYER_UNIT_ARMY_TYPES, ZERO_UNITS, PLAYER_ATTACKING_UNITS} from '../lib/model'
import {Context, Name} from '../lib/context'
import * as userSessions from '../lib/user-sessions'

import {backButtons} from '../lib/interface/menu'
import {calcBattle, remainingPlayerUnits} from '../lib/model/army-math'
import {EMOJI} from '../lib/interface/emoji'
import {formatNamePlain} from '../lib/interface/name'
import {formatNumberShort} from '../lib/interface/format-number'
import {wikidataInfoHeader} from '../lib/interface/generals'

function afterBattleMessageText(attack: boolean, win: boolean, name: Name): string {
	const lines: string[] = []

	let headline = ''
	headline += attack ? EMOJI.attack : EMOJI.defence
	headline += win ? EMOJI.win : EMOJI.lose
	headline += ' '
	headline += '*'
	headline += formatNamePlain(name)
	headline += '*'
	lines.push(headline)

	return lines.join('\n')
}

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('menu.war'), {titlePrefix: EMOJI.war})
	text += '\n\n'

	for (const unit of PLAYER_ATTACKING_UNITS) {
		// eslint-disable-next-line no-await-in-loop
		text += (await ctx.wd.reader(`army.${unit}`)).label()
		text += ': '
		text += formatNumberShort(ctx.session.units[unit], true)
		text += EMOJI[unit]
		text += '\n'
	}

	text += '\n'

	if (ctx.session.attackTarget) {
		const attackTarget = userSessions.getUser(ctx.session.attackTarget)
		if (attackTarget?.name) {
			text += (await ctx.wd.reader('battle.target')).label()
			text += '\n'
			text += formatNamePlain(attackTarget.name)
			text += '\n\n'
		}
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate(menuBody)

menu.interact(async ctx => `${EMOJI.war} ${(await ctx.wd.reader('action.attack')).label()}`, 'attack', {
	hide: ctx => !ctx.session.attackTarget || PLAYER_ATTACKING_UNITS.every(type => ctx.session.units[type] === 0),
	do: async ctx => {
		const now = Date.now() / 1000

		const attacker = ctx.session

		const targetId = ctx.session.attackTarget!
		const target = userSessions.getUser(targetId)!

		delete ctx.session.attackTarget

		if (targetId === ctx.from!.id) {
			await ctx.replyWithMarkdown(
				wikidataInfoHeader(await ctx.wd.reader('battle.suicide'), {titlePrefix: EMOJI.suicide})
			)

			attacker.units = {...ZERO_UNITS}

			return '.'
		}

		const attackerArmy = calcArmyFromPlayerUnits(attacker.units, true, 1)
		const defenderArmy = calcArmyFromPlayerUnits(target.units, false, target.buildings.wall)

		calcBattle(attackerArmy, defenderArmy)

		attacker.units = remainingPlayerUnits(attackerArmy)
		target.units = remainingPlayerUnits(defenderArmy)

		const amountTargetUnits = PLAYER_UNIT_ARMY_TYPES.map(o => target.units[o]).reduce((a, b) => a + b, 0)
		const attackerWins = amountTargetUnits === 0

		await ctx.replyWithMarkdown(afterBattleMessageText(true, attackerWins, target.name!))

		const isBetrayal = attacker.name?.last && attacker.name.last === target.name?.last
		if (isBetrayal) {
			attacker.name = {
				...attacker.name!,
				last: undefined,
				lastChangeLast: now
			}

			await ctx.replyWithMarkdown(
				wikidataInfoHeader(await ctx.wd.reader('battle.betrayal'), {titlePrefix: EMOJI.betrayal})
			)
		}

		if (!target.blocked) {
			try {
				await ctx.tg.sendMessage(targetId, afterBattleMessageText(false, !attackerWins, attacker.name!), Extra.markdown() as any)
			} catch (error) {
				console.error('send defender battlereport failed', targetId, error.message)
				target.blocked = true
			}
		}

		return '.'
	}
})

menu.interact(async ctx => `${EMOJI.search} ${(await ctx.wd.reader('action.search')).label()}`, 'search', {
	do: ctx => {
		const chosen = userSessions.getRandomUser(o => Boolean(o.data.name && o.user !== ctx.session.attackTarget))
		ctx.session.attackTarget = chosen?.user
		return '.'
	}
})

menu.manualRow(backButtons)
