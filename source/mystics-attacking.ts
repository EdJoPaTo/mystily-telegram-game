import {Extra, Telegram} from 'telegraf'

import {formatNumberShort} from './lib/interface/format-number'
import {Session} from './lib/context'
import {TelegrafWikibase} from 'telegraf-wikibase/dist/source'
import {wikidataInfoHeader} from './lib/interface/generals'
import * as userSessions from './lib/user-sessions'
import * as wdSets from './lib/wikidata-sets'
import {Buildings} from './lib/model'
import {EMOJI} from './lib/interface/emoji'

const ATTACK_INTERVAL = 1000 * 60 * 30 // 30 Minutes
let currentMysticQNumber: string | undefined
let currentHealth = 0
let currentGoldStored = 0

// TODO: adapt mystics to new game

let twb: TelegrafWikibase

export function start(telegram: Readonly<Telegram>, telegrafWikibase: TelegrafWikibase): void {
	twb = telegrafWikibase

	setInterval(tryAttack, ATTACK_INTERVAL, telegram)
}

function calcMysticStrenght(mystic: string): number {
	const numbersOfQNumber = mystic
		.split('')
		.slice(1)
		.map(o => Number(o))

	const baseStrength = numbersOfQNumber.reduce((a, b) => a + b, 0)
	return baseStrength
}

export function getCurrentMystical(): {qNumber: string; current: number; max: number; gold: number} {
	if (!currentMysticQNumber || currentHealth <= 0) {
		// Reset Mystic
		currentMysticQNumber = wdSets.getRandom('mystics')
		if (!currentMysticQNumber) {
			throw new Error('mystics not yet initialized')
		}

		currentHealth = calcMysticStrenght(currentMysticQNumber)
		currentGoldStored = 0
	}

	return {
		qNumber: currentMysticQNumber,
		current: Math.round(currentHealth),
		max: calcMysticStrenght(currentMysticQNumber),
		gold: currentGoldStored
	}
}

export function calcBallistaDamage(buildings: Buildings): number {
	const {townhall, barracks} = buildings
	const attackStrength = barracks * 20 / townhall
	return attackStrength
}

async function tryAttack(telegram: Readonly<Telegram>): Promise<void> {
	const {user, data: session} = userSessions.getRandomUser(o => Boolean(o.data.name && !o.data.blocked))

	try {
		const {qNumber, max} = getCurrentMystical()

		const languageCode = session.__wikibase_language_code ?? 'en'

		const battleResult = calcBattle(qNumber, session)
		if (process.env.NODE_ENV !== 'production') {
			console.log('after mystics battle', user, max, currentHealth, calcBallistaDamage(session.buildings))
		}

		const {won, gold, townhall} = battleResult

		let text = ''
		text += wikidataInfoHeader(await twb.reader('construction.placeOfWorship', languageCode), {
			titlePrefix: won ? EMOJI.win : EMOJI.lose
		})

		text += '\n\n'
		text += wikidataInfoHeader(await twb.reader(qNumber, languageCode), {
			titlePrefix: won ? EMOJI.lose : EMOJI.win
		})
		text += '\n'

		if (won) {
			text += '\n'
			text += formatNumberShort(gold, true)
			// Text += EMOJI.gold
		}

		if (Math.abs(townhall) > 0) {
			text += '\n'
			if (townhall < 0) {
				text += EMOJI.fire
			}

			text += EMOJI.townhall
			text += ' '
			if (townhall > 0) {
				text += '+'
			}

			text += townhall
			text += ' '
			text += (await twb.reader('construction.townhall', languageCode)).label()
		}

		await telegram.sendMessage(user, text, Extra.markdown() as any)
	} catch (error) {
		session.blocked = true
		console.log('mystics attack error', user, error.message)
	}
}

interface BattleResult {
	won: boolean;
	gold: number;
	townhall: number;
}

function calcBattle(mystic: string, session: Session): BattleResult {
	const attackStrength = calcBallistaDamage(session.buildings)
	currentHealth -= attackStrength

	const won = currentHealth <= 0

	const {townhall} = session.buildings
	const townhallChange = calcTownhallChange(mystic, won)
	session.buildings = {
		...session.buildings,
		townhall: Math.max(1, townhall + townhallChange)
	}

	if (won) {
		session.resources = {
			...session.resources
		}
	} else {
		session.resources = {
			wood: 0,
			iron: 0,
			loam: 0,
			stone: 0,
			food: 0
		}
	}

	session.resourcesTimestamp = Date.now() / 1000

	return {
		won,
		gold: won ? currentGoldStored : 0,
		townhall: townhallChange
	}
}

function calcTownhallChange(mystic: string, won: boolean): number {
	const mysticStrength = calcMysticStrenght(mystic)

	if (!won) {
		// The average of strength is 27.3
		// Less then the average deals more dmg but dies faster
		return mysticStrength < 27 ? -2 : -1
	}

	const townhallChange = Math.floor(mysticStrength * 0.5)
	return townhallChange
}
