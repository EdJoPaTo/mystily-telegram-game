import {Extra, Telegram} from 'telegraf'
import {TelegrafWikibase} from 'telegraf-wikibase'

import {calcMysticStrength, calcArmyFromPlayerUnits, calcWallArcherBonus, getMysticAsArmy, ZERO_RESOURCES, Building, changeBuildingLevel} from './lib/model'
import {EMOJI} from './lib/interface/emoji'
import {wikidataInfoHeader} from './lib/interface/generals'
import * as userSessions from './lib/user-sessions'
import * as wdSets from './lib/wikidata-sets'
import {calcBattle, remainingPlayerUnits} from './lib/model/army-math'

const BUILDING_TARGETS: readonly Building[] = ['placeOfWorship', 'barracks', 'farm']

const ATTACK_INTERVAL = 1000 * 60 * 30 // 30 Minutes
let currentMysticQNumber: string | undefined
let currentHealth = 0

let twb: TelegrafWikibase

export function start(telegram: Readonly<Telegram>, telegrafWikibase: TelegrafWikibase): void {
	twb = telegrafWikibase

	setInterval(tryAttack, ATTACK_INTERVAL, telegram)
}

export function getCurrentMystical(): Readonly<{qNumber: string; current: number; max: number}> {
	if (!currentMysticQNumber || currentHealth <= 0) {
		// Reset Mystic
		currentMysticQNumber = wdSets.getRandom('mystics')
		if (!currentMysticQNumber) {
			throw new Error('mystics not yet initialized')
		}

		currentHealth = calcMysticStrength(currentMysticQNumber)
	}

	return {
		qNumber: currentMysticQNumber,
		current: Math.round(currentHealth),
		max: calcMysticStrength(currentMysticQNumber)
	}
}

async function tryAttack(telegram: Readonly<Telegram>): Promise<void> {
	const {user, data: session} = userSessions.getRandomUser(o => !o.data.blocked)

	try {
		const now = Date.now() / 1000
		const {qNumber, max} = getCurrentMystical()

		const languageCode = session.__wikibase_language_code ?? 'en'

		const playerArmy = calcArmyFromPlayerUnits(session.units, false, calcWallArcherBonus(session.buildings.wall))
		const mysticArmy = getMysticAsArmy(currentHealth, session.buildings.barracks + session.buildings.placeOfWorship)

		if (process.env.NODE_ENV !== 'production') {
			console.log('befor mystics battle', user, max, currentHealth, session.units)
		}

		calcBattle(mysticArmy, playerArmy)
		session.units = remainingPlayerUnits(playerArmy)
		currentHealth = mysticArmy.map(o => o.remainingHealth).reduce((a, b) => a + b, 0)
		const mysticStillAlive = currentHealth > 0

		if (process.env.NODE_ENV !== 'production') {
			console.log('after mystics battle', user, max, currentHealth, session.units)
		}

		let text = ''
		text += wikidataInfoHeader(await twb.reader('construction.placeOfWorship', languageCode), {
			titlePrefix: mysticStillAlive ? EMOJI.lose : EMOJI.win
		})

		text += '\n\n'
		text += wikidataInfoHeader(await twb.reader(qNumber, languageCode), {
			titlePrefix: mysticStillAlive ? EMOJI.win : EMOJI.lose
		})

		if (mysticStillAlive) {
			session.resources = {...ZERO_RESOURCES}
			session.resourcesTimestamp = now

			for (const targetBuilding of BUILDING_TARGETS) {
				if (session.buildings[targetBuilding] > 0) {
					text += '\n\n'
					text += EMOJI.fire
					text += EMOJI[targetBuilding]
					text += ' -1 '
					text += (await twb.reader(`construction.${targetBuilding}`, languageCode)).label()

					session.buildings = changeBuildingLevel(session.buildings, targetBuilding, before => before - 1)

					break
				}
			}
		}

		await telegram.sendMessage(user, text, Extra.markdown() as any)
	} catch (error) {
		session.blocked = true
		console.log('mystics attack error', user, error.message)
	}
}
