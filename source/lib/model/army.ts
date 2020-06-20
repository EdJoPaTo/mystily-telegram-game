export type PlayerUnitArmyType = 'villager' | 'archer' | 'swordfighter' | 'cleric'
export type ArmyType = PlayerUnitArmyType | 'mystical'
export type WeaponType = 'melee' | 'ranged' | 'mystical'

export const PLAYER_UNIT_ARMY_TYPES: readonly PlayerUnitArmyType[] = ['villager', 'archer', 'swordfighter', 'cleric']
export const PLAYER_ATTACKING_UNITS: readonly PlayerUnitArmyType[] = ['archer', 'swordfighter']

export type BlockChance = Readonly<Record<WeaponType, number>>

export interface Attack {
	readonly type: WeaponType;
	readonly strength: number;
}

export const BLOCK_CHANCE: Readonly<Record<ArmyType, BlockChance>> = {
	villager: {melee: 0.1, ranged: 0.1, mystical: 0.05},
	archer: {melee: 0.2, ranged: 0.6, mystical: 0.1},
	swordfighter: {melee: 0.5, ranged: 0.2, mystical: 0.1},
	cleric: {melee: 0.1, ranged: 0.5, mystical: 0.95},
	mystical: {melee: 0.8, ranged: 0.8, mystical: 0.2}
}

export const BASE_HEALTH: Readonly<Record<ArmyType, number>> = {
	villager: 15,
	archer: 20,
	swordfighter: 40,
	cleric: 20,
	mystical: Number.NaN // Defined by each mystic individually
}

export const BASE_ATTACK: Readonly<Record<ArmyType, Attack>> = {
	villager: {type: 'melee', strength: 3},
	archer: {type: 'ranged', strength: 15},
	swordfighter: {type: 'melee', strength: 15},
	cleric: {type: 'mystical', strength: 10},
	mystical: {type: 'mystical', strength: 100}
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

	for (const type of isAttacker ? PLAYER_ATTACKING_UNITS : PLAYER_UNIT_ARMY_TYPES) {
		for (let i = 0; i < playerUnits[type]; i++) {
			result.push(unitStatsFromType(type, !isAttacker && type === 'archer' ? wallBonus : 1))
		}
	}

	return result
}
