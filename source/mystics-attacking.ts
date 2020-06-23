import {RawObjectInMemoryFile} from '@edjopato/datastore'
import {TelegrafWikibase} from 'telegraf-wikibase'
import {Telegram} from 'telegraf'

import {calcArmyFromPlayerUnits, calcWallArcherBonus, getMysticAsArmy, ZERO_RESOURCES, Building, changeBuildingLevel, calcArmyUnitSum, Mystic, createMysticFromEntityId} from './lib/model'
import {calcBattle, remainingPlayerUnits} from './lib/model/army-math'
import {EMOJI} from './lib/interface/emoji'
import {HOUR, MINUTE} from './lib/unix-time'
import {wikidataInfoHeader} from './lib/interface/generals'
import * as userSessions from './lib/user-sessions'
import * as wdSets from './lib/wikidata-sets'

const BUILDING_TARGETS: readonly Building[] = ['placeOfWorship', 'barracks', 'farm']

const ATTACK_INTERVAL = 30 * MINUTE
const MAX_ATTACK_INTERVAL_PER_PLAYER = 18 * HOUR

const data = new RawObjectInMemoryFile<Mystic>('persist/mystic.json')

let twb: TelegrafWikibase

export function start(telegram: Readonly<Telegram>, telegrafWikibase: TelegrafWikibase): void {
	twb = telegrafWikibase

	setInterval(tryAttack, ATTACK_INTERVAL * 1000, telegram)
}

export async function getCurrentMystical(): Promise<Readonly<Mystic>> {
	if (!data.get()) {
		const qNumber = wdSets.getRandom('mystics')
		if (!qNumber) {
			throw new Error('mystics not yet initialized')
		}

		await data.set(createMysticFromEntityId(qNumber))
	}

	return data.get()!
}

async function tryAttack(telegram: Readonly<Telegram>): Promise<void> {
	const now = Date.now() / 1000
	const visitedByMysticsNoLaterThan = now - MAX_ATTACK_INTERVAL_PER_PLAYER
	const target = userSessions.getRandomUser(o => !o.data.blocked && o.data.lastMysticAttack < visitedByMysticsNoLaterThan)

	if (!target) {
		// No suitable player found
		return
	}

	const {user, data: session} = target

	try {
		const languageCode = session.__wikibase_language_code ?? 'en'

		const currentMystic = await getCurrentMystical()
		const {qNumber, maxHealth, remainingHealth} = currentMystic
		const readerMystic = await twb.reader(qNumber, languageCode)

		const playerArmy = calcArmyFromPlayerUnits(session.units, false, calcWallArcherBonus(session.buildings.wall))
		const mysticArmy = getMysticAsArmy(remainingHealth, session.buildings.barracks + session.buildings.placeOfWorship)

		if (process.env.NODE_ENV !== 'production') {
			console.log('befor mystics battle', user, maxHealth, remainingHealth, calcArmyUnitSum(session.units), session.units)
		}

		calcBattle(mysticArmy, playerArmy)
		session.units = remainingPlayerUnits(playerArmy)
		session.lastMysticAttack = now
		const newRemainingHealth = mysticArmy.map(o => o.remainingHealth).reduce((a, b) => a + b, 0)
		const mysticStillAlive = newRemainingHealth > 0

		if (process.env.NODE_ENV !== 'production') {
			console.log('after mystics battle', user, maxHealth, newRemainingHealth, calcArmyUnitSum(session.units), session.units)
		}

		if (mysticStillAlive) {
			await data.set({...currentMystic, remainingHealth: newRemainingHealth})
		} else {
			data.delete()
		}

		let text = ''
		text += wikidataInfoHeader(await twb.reader('construction.placeOfWorship', languageCode), {
			titlePrefix: mysticStillAlive ? EMOJI.lose : EMOJI.win
		})

		text += '\n\n'
		text += wikidataInfoHeader(readerMystic, {
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
					// eslint-disable-next-line no-await-in-loop
					text += (await twb.reader(`construction.${targetBuilding}`, languageCode)).label()

					session.buildings = changeBuildingLevel(session.buildings, targetBuilding, before => before - 1)

					break
				}
			}
		}

		const photo = readerMystic.images(800)[0]
		await telegram.sendPhoto(user, photo, {
			caption: text,
			parse_mode: 'Markdown'
		})
	} catch (error) {
		session.blocked = true
		console.log('mystics attack error', user, error.message)
	}
}
