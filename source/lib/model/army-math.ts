import {Army, PlayerUnits, BLOCK_CHANCE} from './army'
import randomItem from 'random-item'

export interface BattleResult {
	readonly attackerWins: boolean;
	readonly attackerArmyRemaining: PlayerUnits;
	readonly defenderArmyRemaining: PlayerUnits;
}

export function determineBattleResult(attacker: Army, defender: Army): BattleResult {
	const attackerSane = attacker.filter(o => o.remainingHealth > 0)
	const defenderSane = defender.filter(o => o.remainingHealth > 0)

	return {
		attackerWins: defenderSane.length === 0,
		attackerArmyRemaining: remainingPlayerUnits(attackerSane),
		defenderArmyRemaining: remainingPlayerUnits(defenderSane)
	}
}

export function remainingPlayerUnits(army: Army): PlayerUnits {
	const sane = army.filter(o => o.remainingHealth > 0)
	return {
		archer: sane.filter(o => o.type === 'archer').length,
		cleric: sane.filter(o => o.type === 'cleric').length,
		swordfighter: sane.filter(o => o.type === 'swordfighter').length,
		villager: sane.filter(o => o.type === 'villager').length
	}
}

export function calcBattle(attacker: Army, defender: Army): void {
	for (let round = 0; round < 5; round++) {
		if (attacker.length === 0 || defender.length === 0) {
			break
		}

		calcHalfRound(attacker, defender)
		calcHalfRound(defender, attacker)

		attacker = attacker.filter(o => o.remainingHealth > 0)
		defender = defender.filter(o => o.remainingHealth > 0)
	}
}

function calcHalfRound(engaging: Army, passive: Army): void {
	for (const unit of engaging) {
		const target = randomItem(passive)
		const targetBlockChances = BLOCK_CHANCE[target.type]
		const targetBlockChance = targetBlockChances[unit.attack.type]

		if (Math.random() > targetBlockChance) {
			target.remainingHealth -= unit.attack.strength
		}
	}
}
