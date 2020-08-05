import {html as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {Telegram} from 'telegraf'

import {armyFromBarracksUnits, calcBattle, remainingBarracksUnits, armyFromPlaceOfWorship, Army, armyFromWallGuards, remainingWallguards, BATTLE_TIME} from '../../lib/model/battle-math'
import {calculateBattleFatigue, calculatePlayerAttackImmunity, calculateLoot} from '../../lib/model/war'
import {Context, Name} from '../../lib/context'
import {PLAYER_BARRACKS_ARMY_TYPES, ZERO_BARRACKS_UNITS, calcUnitSum} from '../../lib/model/units'
import {Resources, ZERO_RESOURCES} from '../../lib/model/resources'
import {updateSession} from '../../lib/session-state-math'
import * as resourceMath from '../../lib/model/resource-math'
import * as userSessions from '../../lib/user-sessions'

import {backButtons} from '../../lib/interface/menu'
import {EMOJI} from '../../lib/interface/emoji'
import {formatCooldown} from '../../lib/interface/format-time'
import {formatNamePlain} from '../../lib/interface/name'
import {formatNumberShort} from '../../lib/interface/format-number'
import {generateArmyOneLine} from '../../lib/interface/units'
import {resourceSingleLine} from '../../lib/interface/resource'
import {wikidataInfoHeader} from '../../lib/interface/generals'

type TelegramPlayerId = number

interface Battlestate {
	readonly attackerId: TelegramPlayerId;
	readonly targetId: TelegramPlayerId;
	readonly attackerArmy: Army;
}

function battleReportPart(emoji: string, name: Name, army: Army): string {
	let text = ''
	text += emoji
	text += ' '
	text += format.bold(format.escape(formatNamePlain(name)))
	text += '\n'
	text += generateArmyOneLine(army)
	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const now = Date.now() / 1000
	let text = ''
	text += wikidataInfoHeader(await ctx.wd.reader('menu.war'), {titlePrefix: EMOJI.war})
	text += '\n\n'

	const isCurrentlyAttacking = Boolean(ctx.session.attackTime && ctx.session.attackTime > now)

	if (!isCurrentlyAttacking) {
		const unitLines = await Promise.all(PLAYER_BARRACKS_ARMY_TYPES
			.map(async unit => {
				const reader = await ctx.wd.reader(`army.${unit}`)
				const amount = ctx.session.barracksUnits[unit]
				return `${reader.label()}: ${formatNumberShort(amount, true)}${EMOJI[unit]}`
			})
		)
		text += unitLines.join('\n')
		text += '\n\n'
	}

	if (isCurrentlyAttacking) {
		text += (await ctx.wd.reader('battle.inProgress')).label()
		text += '…'
		text += '\n\n'
	}

	if (ctx.session.attackTarget) {
		const attackTarget = userSessions.getUser(ctx.session.attackTarget)
		if (attackTarget?.name) {
			text += '*'
			text += (await ctx.wd.reader('battle.target')).label()
			text += '*'
			text += '\n'
			text += formatNamePlain(attackTarget.name)
			text += '\n\n'
		}
	}

	if (!isCurrentlyAttacking && ctx.session.battleCooldownEnd && ctx.session.battleFatigueEnd && ctx.session.battleFatigueEnd > now) {
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
		const {attackTarget} = ctx.session
		if (!attackTarget) {
			return true
		}

		const isCurrentlyAttacking = Boolean(ctx.session.attackTime && ctx.session.attackTime > now)
		const hasNoUnits = calcUnitSum(ctx.session.barracksUnits) === 0
		const hasCooldown = ctx.session.battleCooldownEnd ? ctx.session.battleCooldownEnd > now : false
		if (isCurrentlyAttacking || hasNoUnits || hasCooldown) {
			return true
		}

		const targetImmuneUntil = userSessions.getUser(attackTarget)!.immuneToPlayerAttacksUntil
		if (targetImmuneUntil > now) {
			delete ctx.session.attackTarget
			return true
		}

		return false
	},
	do: async ctx => {
		const now = Date.now() / 1000

		const attacker = ctx.session

		const targetId = ctx.session.attackTarget!

		if (targetId === ctx.from!.id) {
			await ctx.replyWithMarkdown(
				wikidataInfoHeader(await ctx.wd.reader('battle.suicide'), {titlePrefix: EMOJI.suicide})
			)

			attacker.barracksUnits = {...ZERO_BARRACKS_UNITS}

			return '.'
		}

		const target = userSessions.getUser(targetId)!
		updateSession(target, now)

		attacker.attackTime = now + BATTLE_TIME
		target.immuneToPlayerAttacksUntil = calculatePlayerAttackImmunity(now)

		const attackerArmy = armyFromBarracksUnits(attacker.barracksUnits)
		attacker.barracksUnits = {...ZERO_BARRACKS_UNITS}

		const state: Battlestate = {
			attackerId: ctx.from!.id,
			targetId,
			attackerArmy
		}

		setTimeout(async () => handleBattle(ctx.tg, state), BATTLE_TIME * 1000)

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

		return true
	}
})

async function handleBattle(telegram: Telegram, state: Battlestate): Promise<void> {
	try {
		const now = Date.now() / 1000
		const {attackerId, targetId, attackerArmy} = state

		const attacker = userSessions.getUser(attackerId)!
		const target = userSessions.getUser(targetId)!
		updateSession(attacker, now)
		updateSession(target, now)

		const defenderArmy = [
			...armyFromBarracksUnits(target.barracksUnits),
			...armyFromWallGuards(target.wallguards),
			...armyFromPlaceOfWorship(target.buildings.placeOfWorship)
		]

		calcBattle(attackerArmy, defenderArmy)

		const attackerWins = defenderArmy.filter(o => o.remainingHealth > 0).length === 0
		attacker.barracksUnits = remainingBarracksUnits(attackerArmy)
		target.barracksUnits = remainingBarracksUnits(defenderArmy)
		target.wallguards = remainingWallguards(defenderArmy)

		const currentFatigueSeconds = Math.max(0, attacker.battleFatigueEnd ? attacker.battleFatigueEnd - now : 0)
		const {cooldownSeconds, newFatigueSeconds} = calculateBattleFatigue(currentFatigueSeconds)
		attacker.battleCooldownEnd = now + cooldownSeconds
		attacker.battleFatigueEnd = now + newFatigueSeconds
		delete attacker.attackTarget

		let loot: Resources = ZERO_RESOURCES
		if (attackerWins) {
			loot = calculateLoot(attacker.barracksUnits, target.resources)
			attacker.resources = resourceMath.sum(attacker.resources, loot)
			target.resources = resourceMath.subtract(target.resources, loot)
		}

		const textParts: string[] = []
		textParts.push(battleReportPart(EMOJI.attack, attacker.name!, attackerArmy))
		textParts.push(battleReportPart(EMOJI.defence, target.name!, defenderArmy))
		textParts.push(EMOJI.war + EMOJI.war + EMOJI.war)
		textParts.push(battleReportPart(attackerWins ? EMOJI.win : EMOJI.lose, attacker.name!, attackerArmy.filter(o => o.remainingHealth > 0)))
		textParts.push(battleReportPart(attackerWins ? EMOJI.lose : EMOJI.win, target.name!, defenderArmy.filter(o => o.remainingHealth > 0)))

		if (resourceMath.areAny(loot)) {
			textParts.push(EMOJI.loot + '  ' + resourceSingleLine(loot))
		}

		const text = textParts.map(o => o.trim()).join('\n\n')

		if (!attacker.blocked) {
			try {
				await telegram.sendMessage(attackerId, text, {parse_mode: format.parse_mode})
			} catch (error) {
				console.error('send attacker battlereport failed', attackerId, error.message)
				attacker.blocked = true
			}
		}

		if (!target.blocked) {
			try {
				await telegram.sendMessage(targetId, text, {parse_mode: format.parse_mode})
			} catch (error) {
				console.error('send defender battlereport failed', targetId, error.message)
				target.blocked = true
			}
		}
	} catch (error) {
		console.error('handleBattle failed', state, error)
	}
}

menu.interact(async ctx => `${EMOJI.search} ${(await ctx.wd.reader('action.search')).label()}`, 'search', {
	hide: ctx => {
		const now = Date.now() / 1000
		const isCurrentlyAttacking = Boolean(ctx.session.attackTime && ctx.session.attackTime > now)
		return isCurrentlyAttacking
	},
	do: ctx => {
		const now = Date.now() / 1000
		const chosen = userSessions.getRandomUser(o => Boolean(o.data.name && o.user !== ctx.session.attackTarget && o.data.immuneToPlayerAttacksUntil < now))
		ctx.session.attackTarget = chosen?.user
		return '.'
	}
})

menu.manualRow(backButtons)
