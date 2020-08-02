import {RawObjectInMemoryFile} from '@edjopato/datastore'
import {TelegrafWikibase} from 'telegraf-wikibase'
import {Telegram} from 'telegraf'
import randomItem from 'random-item'

import {armyFromBarracksUnits, calcBattle, remainingBarracksUnits, armyFromPlaceOfWorship, armyFromWallGuards, remainingWallguards} from './lib/model/battle-math'
import {BUILDINGS, changeBuildingLevel} from './lib/model/buildings'
import {calculatePlayerAttackImmunity} from './lib/model/war'
import {calcUnitSum} from './lib/model/units'
import {HOUR, MINUTE, DAY} from './lib/unix-time'
import {Mystic, createMysticFromEntityId, getMysticAsArmy} from './lib/model/mystic'
import * as userSessions from './lib/user-sessions'
import * as wdSets from './lib/wikidata-sets'

import {EMOJI} from './lib/interface/emoji'
import {wikidataInfoHeader} from './lib/interface/generals'

const ATTACK_INTERVAL = 30 * MINUTE
// Rotate around the day to ensure all timezones are equally "happy"
const MAX_ATTACK_INTERVAL_PER_PLAYER = (3 * DAY) + (2 * HOUR)

const data = new RawObjectInMemoryFile<Mystic>('persist/mystic.json')

let twb: TelegrafWikibase

export function start(telegram: Readonly<Telegram>, telegrafWikibase: TelegrafWikibase): void {
	twb = telegrafWikibase

	setInterval(tryAttack, ATTACK_INTERVAL * 1000, telegram)
}

export async function getCurrentMystic(): Promise<Readonly<Mystic>> {
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
	const target = userSessions.getRandomUser(o => !o.data.blocked && o.data.lastMysticAttack < visitedByMysticsNoLaterThan && o.data.immuneToPlayerAttacksUntil < now)

	if (!target) {
		// No suitable player found
		return
	}

	const {user, data: session} = target

	try {
		const languageCode = session.__wikibase_language_code ?? 'en'

		const currentMystic = await getCurrentMystic()
		const {qNumber, maxHealth, remainingHealth} = currentMystic
		const readerMystic = await twb.reader(qNumber, languageCode)

		const playerArmy = [
			...armyFromBarracksUnits(session.barracksUnits),
			...armyFromWallGuards(session.wallguards),
			...armyFromPlaceOfWorship(session.buildings.placeOfWorship)
		]
		const mysticArmy = getMysticAsArmy(remainingHealth, session.buildings.barracks + session.buildings.placeOfWorship)

		if (process.env.NODE_ENV !== 'production') {
			console.log('befor mystics battle', user, maxHealth, remainingHealth, calcUnitSum(session.barracksUnits), session.barracksUnits)
		}

		calcBattle(mysticArmy, playerArmy)
		session.barracksUnits = remainingBarracksUnits(playerArmy)
		session.wallguards = remainingWallguards(playerArmy)
		session.immuneToPlayerAttacksUntil = calculatePlayerAttackImmunity(now)
		session.lastMysticAttack = now
		const newRemainingHealth = mysticArmy.map(o => o.remainingHealth).reduce((a, b) => a + b, 0)
		const mysticStillAlive = newRemainingHealth > 0

		if (process.env.NODE_ENV !== 'production') {
			console.log('after mystics battle', user, maxHealth, newRemainingHealth, calcUnitSum(session.barracksUnits), session.barracksUnits)
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
			session.resources = {
				food: Math.floor(session.resources.food * Math.random()),
				iron: Math.floor(session.resources.iron * Math.random()),
				loam: Math.floor(session.resources.loam * Math.random()),
				stone: Math.floor(session.resources.stone * Math.random()),
				wood: Math.floor(session.resources.wood * Math.random())
			}
			session.resourcesTimestamp = now

			const targetBuilding = randomItem(BUILDINGS.filter(o => session.buildings[o] > 0))
			if (targetBuilding) {
				const currentLevel = session.buildings[targetBuilding]
				// Reduce randomly between 1 and 10 but max 10% of the building level
				const maxReduction = Math.min(10, Math.ceil(currentLevel / 10))
				// Reduce at least 1
				const reduction = Math.ceil(Math.random() * maxReduction)

				text += '\n\n'
				text += EMOJI.fire
				text += EMOJI[targetBuilding]
				text += ' -'
				text += reduction
				text += ' '
				text += (await twb.reader(`construction.${targetBuilding}`, languageCode)).label()

				session.buildings = changeBuildingLevel(session.buildings, targetBuilding, before => before - reduction)
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
