import {html as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {Telegram} from 'telegraf'
import arrayFilterUnique from 'array-filter-unique'

import {armyFromBarracksUnits, calcBattle, remainingBarracksUnits, armyFromPlaceOfWorship, Army, armyFromWallGuards, remainingWallguards, BATTLE_TIME} from '../../lib/model/battle-math'
import {BUILDINGS} from '../../lib/model/buildings'
import {calculateBattleFatigue, calculatePlayerAttackImmunity, calculateLoot} from '../../lib/model/war'
import {Context, Name, Session} from '../../lib/context'
import {i18n} from '../../lib/i18n'
import {MINUTE} from '../../lib/unix-time'
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

type QNumber = string
type TelegramPlayerId = number

interface Battlestate {
	readonly attackerId: TelegramPlayerId;
	readonly targetId: TelegramPlayerId;
	readonly attackerArmy: Army;
}

interface Spystate {
	readonly attackerId: TelegramPlayerId;
	readonly targetId: TelegramPlayerId;
	readonly attackerSpies: readonly QNumber[];
}

const SPY_TIME = MINUTE

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

function qNumberDigitSum(qNumber: string): number {
	return qNumber
		.slice(1)
		.split('')
		.map(o => Number(o))
		.reduce((a, b) => a + b, 0)
}

menu.interact(async context => `${EMOJI.espionage} ${(await context.wd.reader('action.espionage')).label()}`, 'spy', {
	hide: context => {
		if (context.session.spies.length === 0) {
			return true
		}

		return !canInteractWithTarget(context)
	},
	do: async context => {
		const now = Date.now() / 1000
		const targetId = context.session.attackTarget!

		context.session.attackTime = now + BATTLE_TIME

		const attackerSpies = [...context.session.spies]
		context.session.spies = []

		const state: Spystate = {
			attackerId: context.from!.id,
			targetId,
			attackerSpies
		}

		setTimeout(async () => handleSpies(context.tg, state), SPY_TIME * 1000)
		return true
	}
})

function randomBuildingOffset(): number {
	return Math.round((Math.random() - 0.5) * 6)
}

async function handleSpies(telegram: Telegram, state: Spystate): Promise<void> {
	const now = Date.now() / 1000
	const {attackerId, targetId, attackerSpies} = state

	const attacker = userSessions.getUser(attackerId)!
	const target = userSessions.getUser(targetId)!
	updateSession(attacker, now)
	updateSession(target, now)

	const totalAttackerSpies = attackerSpies.length
	const totalDefenderSpies = target.spies.length
	const spySuperiority = Math.ceil(totalAttackerSpies - Math.floor(totalDefenderSpies / 2))

	const targetBuildings = new Set(attackerSpies
		.map(o => qNumberDigitSum(o))
		.map(o => BUILDINGS[o % BUILDINGS.length])
		.filter(arrayFilterUnique())
		.slice(0, Math.max(0, spySuperiority)))

	const buildingLine = BUILDINGS
		.filter(o => targetBuildings.has(o))
		.map(building => {
			const emoji = EMOJI[building]
			const attackerLevel = attacker.buildings[building] + randomBuildingOffset()
			const targetLevel = target.buildings[building] + randomBuildingOffset()
			const relative = targetLevel > attackerLevel ? '↑' : '↓'
			return emoji + relative
		})
		.join(' ')

	let text = ''
	text += EMOJI.espionage
	text += ' '
	text += buildingLine
	if (targetBuildings.size === 0) {
		text += '💀'
	}

	if (!attacker.blocked) {
		try {
			await telegram.sendMessage(attackerId, text, {parse_mode: format.parse_mode})
		} catch (error) {
			console.error('send attacker spyreport failed', attackerId, error.message)
			attacker.blocked = true
		}
	}

	if (totalDefenderSpies > 0) { // && !target.blocked) {
		const targetText = i18n.t(
			target.__wikibase_language_code,
			spySuperiority > 0 ? 'spy.gotSpied.assume' : 'spy.gotSpied.catched'
		)

		try {
			await telegram.sendMessage(targetId, targetText)
		} catch (error) {
			console.error('send target got spied failed', targetId, error.message)
			target.blocked = true
		}
	}
}

menu.interact(async ctx => `${EMOJI.war} ${(await ctx.wd.reader('action.attack')).label()}`, 'attack', {
	joinLastRow: true,
	hide: context => {
		if (calcUnitSum(context.session.barracksUnits) === 0) {
			return true
		}

		return !canInteractWithTarget(context)
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

		applyFatiqueAndCooldown(attacker, now)
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

function canInteractWithTarget(context: Context): boolean {
	const now = Date.now() / 1000
	const {attackTarget} = context.session
	if (!attackTarget) {
		return false
	}

	const isCurrentlyAttacking = Boolean(context.session.attackTime && context.session.attackTime > now)
	const hasCooldown = context.session.battleCooldownEnd ? context.session.battleCooldownEnd > now : false
	if (isCurrentlyAttacking || hasCooldown) {
		return false
	}

	const targetImmuneUntil = userSessions.getUser(attackTarget)!.immuneToPlayerAttacksUntil
	if (targetImmuneUntil > now) {
		delete context.session.attackTarget
		return false
	}

	return true
}

function applyFatiqueAndCooldown(session: Session, now: number): void {
	const currentFatigueSeconds = Math.max(0, session.battleFatigueEnd ? session.battleFatigueEnd - now : 0)
	const {cooldownSeconds, newFatigueSeconds} = calculateBattleFatigue(currentFatigueSeconds)
	session.battleCooldownEnd = now + cooldownSeconds
	session.battleFatigueEnd = now + newFatigueSeconds
}
