export type PlayerUnitArmyType = 'villager' | 'archer' | 'swordfighter' | 'cleric'
export type ArmyType = PlayerUnitArmyType | 'mystic'
export type WeaponType = 'sword' | 'bow' | 'mystic'

export const PLAYER_UNIT_ARMY_TYPES: readonly PlayerUnitArmyType[] = ['villager', 'archer', 'swordfighter', 'cleric']

export type BlockChance = Readonly<Record<WeaponType, number>>

export interface Attack {
	readonly type: WeaponType;
	readonly strength: number;
}

export const BLOCK_CHANCE: Readonly<Record<ArmyType, BlockChance>> = {
	villager: {sword: 0.1, bow: 0.1, mystic: 0.05},
	archer: {sword: 0.2, bow: 0.6, mystic: 0.1},
	swordfighter: {sword: 0.5, bow: 0.2, mystic: 0.1},
	cleric: {sword: 0.1, bow: 0.5, mystic: 0.95},
	mystic: {sword: 0.8, bow: 0.8, mystic: 0.2}
}

export const BASE_HEALTH: Readonly<Record<ArmyType, number>> = {
	villager: 15,
	archer: 20,
	swordfighter: 40,
	cleric: 20,
	mystic: Number.NaN // Defined by each mystic individually
}

export const BASE_ATTACK: Readonly<Record<ArmyType, Attack>> = {
	villager: {type: 'sword', strength: 3},
	archer: {type: 'bow', strength: 15},
	swordfighter: {type: 'sword', strength: 15},
	cleric: {type: 'mystic', strength: 10},
	mystic: {type: 'mystic', strength: 100}
}

export interface PlayerUnits {
	readonly villager: number;
	readonly archer: number;
	readonly swordfighter: number;
	readonly cleric: number;
}

export const ZERO_UNITS: PlayerUnits = {
	villager: 0,
	archer: 0,
	swordfighter: 0,
	cleric: 0
}

export interface UnitStats {
	readonly type: ArmyType;
	readonly attack: Attack;
	remainingHealth: number;
}

export type Army = readonly UnitStats[]

export function calcWallArcherBonus(currentWallLevel: number): number {
	return 1 + (currentWallLevel * 0.3)
}

export function calcMaxPeoplePerBarracks(currentBarracksLevel: number): number {
	return currentBarracksLevel * 10
}

function unitStatsFromType(type: ArmyType, wallBonus: number): UnitStats {
	return {
		type,
		attack: BASE_ATTACK[type],
		remainingHealth: BASE_HEALTH[type] * wallBonus
	}
}

export function calcArmyFromPlayerUnits(playerUnits: PlayerUnits, isAttacker: boolean, wallBonus: number): Army {
	const result: UnitStats[] = []

	if (!isAttacker) {
		for (let i = 0; i < playerUnits.villager; i++) {
			result.push(unitStatsFromType('villager', 1))
		}

		for (let i = 0; i < playerUnits.cleric; i++) {
			result.push(unitStatsFromType('cleric', 1))
		}
	}

	for (let i = 0; i < playerUnits.swordfighter; i++) {
		result.push(unitStatsFromType('swordfighter', 1))
	}

	for (let i = 0; i < playerUnits.archer; i++) {
		result.push(unitStatsFromType('archer', wallBonus))
	}

	return result
}
