import {PlayerUnits, BLOCK_CHANCE, BASE_ATTACK, BASE_HEALTH, ArmyType, Attack, PLAYER_UNIT_ARMY_TYPES} from './units'
import randomItem from 'random-item'

export type Army = readonly UnitStats[]

export interface UnitStats {
	readonly type: ArmyType;
	readonly attack: Attack;
	remainingHealth: number;
}

export interface BattleResult {
	readonly attackerWins: boolean;
	readonly attackerArmyRemaining: PlayerUnits;
	readonly defenderArmyRemaining: PlayerUnits;
}

function unitStatsFromType(type: ArmyType, wallBonus: number): UnitStats {
	return {
		type,
		attack: BASE_ATTACK[type],
		remainingHealth: BASE_HEALTH[type] * wallBonus
	}
}

export function calcArmyFromUnits(playerUnits: Partial<PlayerUnits>, wallBonus: number): Army {
	const result: UnitStats[] = []

	for (const type of PLAYER_UNIT_ARMY_TYPES) {
		for (let i = 0; i < (playerUnits[type] ?? 0); i++) {
			result.push(unitStatsFromType(type, type === 'archer' ? wallBonus : 1))
		}
	}

	return result
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
