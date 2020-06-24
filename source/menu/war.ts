import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {html as format} from 'telegram-format'

import {calcArmyFromUnits, calcBattle, remainingPlayerUnits} from '../lib/model/battle-math'
import {calculateBattleFatigue} from '../lib/model/war'
import {Context, Name} from '../lib/context'
import {PLAYER_ATTACKING_UNITS, calcPartialUnitsFromPlayerUnits, calcWallArcherBonus, ZERO_UNITS, calcUnitSum, PlayerUnits} from '../lib/model/units'
import * as userSessions from '../lib/user-sessions'

import {backButtons} from '../lib/interface/menu'
import {EMOJI} from '../lib/interface/emoji'
import {formatCooldown} from '../lib/interface/format-time'
import {formatNamePlain} from '../lib/interface/name'
import {formatNumberShort} from '../lib/interface/format-number'
import {generateUnitOneLine} from '../lib/interface/units'
import {wikidataInfoHeader} from '../lib/interface/generals'

function battleReportPart(emoji: string, name: Name, units: Partial<PlayerUnits>): string {
	let text = ''
	text += emoji
	text += ' '
	text += format.bold(format.escape(formatNamePlain(name)))
	text += '\n'
	text += generateUnitOneLine(units)
	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const now = Date.now() / 1000
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

	if (ctx.session.battleCooldownEnd && ctx.session.battleFatigueEnd && ctx.session.battleFatigueEnd > now) {
		const remainingCooldownSeconds = ctx.session.battleCooldownEnd - now
		const remainingFatigueSeconds = ctx.session.battleFatigueEnd - now

		if (remainingCooldownSeconds > 0) {
			text += (await ctx.wd.reader('battle.cooldown')).label()
			text += ': '
			text += await formatCooldown(ctx, remainingCooldownSeconds)
			text += '\n'
		}

		text += (await ctx.wd.reader('battle.fatigue')).label()
		text += ': '
		text += await formatCooldown(ctx, remainingFatigueSeconds)
		text += '\n'
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate(menuBody)

menu.interact(async ctx => `${EMOJI.war} ${(await ctx.wd.reader('action.attack')).label()}`, 'attack', {
	hide: ctx => {
		const now = Date.now() / 1000

		const hasNoTarget = !ctx.session.attackTarget
		const hasNoUnits = PLAYER_ATTACKING_UNITS.every(type => ctx.session.units[type] === 0)
		const hasCooldown = ctx.session.battleCooldownEnd ? ctx.session.battleCooldownEnd > now : false

		return hasNoTarget || hasNoUnits || hasCooldown
	},
	do: async ctx => {
		const now = Date.now() / 1000

		const attacker = ctx.session
		const attackingUnits = calcPartialUnitsFromPlayerUnits(attacker.units, PLAYER_ATTACKING_UNITS)

		const targetId = ctx.session.attackTarget!
		const target = userSessions.getUser(targetId)!
		const defendingUnits = target.units
		const targetWallBonus = calcWallArcherBonus(target.buildings.wall)

		delete ctx.session.attackTarget

		if (targetId === ctx.from!.id) {
			await ctx.replyWithMarkdown(
				wikidataInfoHeader(await ctx.wd.reader('battle.suicide'), {titlePrefix: EMOJI.suicide})
			)

			attacker.units = {...ZERO_UNITS}

			return '.'
		}

		const attackerArmy = calcArmyFromUnits(attackingUnits, 1)
		const defenderArmy = calcArmyFromUnits(defendingUnits, targetWallBonus)

		calcBattle(attackerArmy, defenderArmy)

		attacker.units = remainingPlayerUnits(attackerArmy)
		target.units = remainingPlayerUnits(defenderArmy)

		const amountTargetUnits = calcUnitSum(target.units)
		const attackerWins = amountTargetUnits === 0

		const currentFatigueSeconds = Math.max(0, ctx.session.battleFatigueEnd ? ctx.session.battleFatigueEnd - now : 0)
		const {cooldownSeconds, newFatigueSeconds} = calculateBattleFatigue(currentFatigueSeconds)
		ctx.session.battleCooldownEnd = now + cooldownSeconds
		ctx.session.battleFatigueEnd = now + newFatigueSeconds

		const textParts: string[] = []
		textParts.push(battleReportPart(EMOJI.attack, attacker.name!, attackingUnits))
		textParts.push(battleReportPart(EMOJI.defence, target.name!, defendingUnits))
		textParts.push(EMOJI.war + EMOJI.war + EMOJI.war)
		textParts.push(battleReportPart(attackerWins ? EMOJI.win : EMOJI.lose, attacker.name!, attacker.units))
		textParts.push(battleReportPart(attackerWins ? EMOJI.lose : EMOJI.win, target.name!, target.units))
		textParts.push('lazy dev… no loot yet…')
		const text = textParts.map(o => o.trim()).join('\n\n')

		await ctx.reply(text, {parse_mode: format.parse_mode})

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
				await ctx.tg.sendMessage(targetId, text, {parse_mode: format.parse_mode})
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
