import {Resources} from './resources'

export type PlayerUnitArmyType = 'villager' | 'archer' | 'swordfighter' | 'cleric'
export type ArmyType = PlayerUnitArmyType | 'mystic'
export type WeaponType = 'melee' | 'ranged' | 'mystical'

export const PLAYER_UNIT_ARMY_TYPES: readonly PlayerUnitArmyType[] = ['villager', 'archer', 'swordfighter', 'cleric']
export const PLAYER_ATTACKING_UNITS: readonly PlayerUnitArmyType[] = ['villager', 'archer', 'swordfighter']

export const WEAPON_TYPES: readonly WeaponType[] = ['melee', 'ranged', 'mystical']

export type BlockChance = Readonly<Record<WeaponType, number>>

export interface Attack {
	readonly type: WeaponType;
	readonly strength: number;
}

export const BLOCK_CHANCE: Readonly<Record<ArmyType, BlockChance>> = {
	villager: {melee: 0.1, ranged: 0.1, mystical: 0.35},
	archer: {melee: 0.2, ranged: 0.6, mystical: 0.1},
	swordfighter: {melee: 0.5, ranged: 0.2, mystical: 0.1},
	cleric: {melee: 0.1, ranged: 0.5, mystical: 0.95},
	mystic: {melee: 0.9, ranged: 0.9, mystical: 0.1}
}

export const BASE_HEALTH: Readonly<Record<ArmyType, number>> = {
	villager: 15,
	archer: 20,
	swordfighter: 40,
	cleric: 20,
	mystic: Number.NaN // Defined by each mystic individually
}

export const BASE_ATTACK: Readonly<Record<ArmyType, Attack>> = {
	villager: {type: 'melee', strength: 3},
	archer: {type: 'ranged', strength: 15},
	swordfighter: {type: 'melee', strength: 15},
	cleric: {type: 'mystical', strength: 30},
	mystic: {type: 'mystical', strength: 100}
}

export const UNIT_COST: Readonly<Record<PlayerUnitArmyType, Resources>> = {
	villager: {food: 100, wood: 50, loam: 20, stone: 0, iron: 0},
	archer: {food: 500, wood: 500, loam: 100, stone: 0, iron: 50},
	swordfighter: {food: 1500, wood: 200, loam: 400, stone: 200, iron: 800},
	cleric: {food: 2000, wood: 800, loam: 1400, stone: 400, iron: 200}
}

export type PlayerUnits = Readonly<Record<PlayerUnitArmyType, number>>

export const ZERO_UNITS: PlayerUnits = {
	archer: 0,
	cleric: 0,
	swordfighter: 0,
	villager: 0
}

export function calcWallArcherBonus(currentWallLevel: number): number {
	return 1 + (currentWallLevel * 0.3)
}

export function calcMaxPeoplePerBarracks(currentBarracksLevel: number): number {
	return currentBarracksLevel * 10
}

export function calcPartialUnitsFromPlayerUnits(playerUnits: PlayerUnits, relevantUnits: readonly PlayerUnitArmyType[]): Partial<PlayerUnits> {
	const result: Partial<Record<PlayerUnitArmyType, number>> = {}
	for (const type of relevantUnits) {
		result[type] = playerUnits[type]
	}

	return result
}

export function calcUnitSum(playerUnits: Partial<PlayerUnits>): number {
	return PLAYER_UNIT_ARMY_TYPES
		.map(o => playerUnits[o] ?? 0)
		.reduce((a, b) => a + b)
}
