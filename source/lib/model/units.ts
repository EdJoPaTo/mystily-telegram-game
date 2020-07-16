import {Resources} from './resources'

export type BarracksArmyType = 'villager' | 'archer' | 'swordfighter' | 'wagon'
export type ArmyType = BarracksArmyType | 'cleric' | 'wallguard' | 'mystic'
export type WeaponType = 'melee' | 'ranged' | 'mystical'

export const PLAYER_BARRACKS_ARMY_TYPES: readonly BarracksArmyType[] = ['villager', 'archer', 'swordfighter', 'wagon']
export const PLAYER_ARMY_TYPES: readonly ArmyType[] = [...PLAYER_BARRACKS_ARMY_TYPES, 'cleric', 'wallguard']

export const WEAPON_TYPES: readonly WeaponType[] = ['melee', 'ranged', 'mystical']

export type BlockChance = Readonly<Record<WeaponType, number>>

export interface Attack {
	readonly type: WeaponType;
	readonly strength: number;
}

export function isBarracksArmyType(type: ArmyType): type is BarracksArmyType {
	return (PLAYER_BARRACKS_ARMY_TYPES as string[]).includes(type)
}

export const BLOCK_CHANCE: Readonly<Record<ArmyType, BlockChance>> = {
	villager: {melee: 0.1, ranged: 0.1, mystical: 0.35},
	archer: {melee: 0.2, ranged: 0.6, mystical: 0.1},
	swordfighter: {melee: 0.5, ranged: 0.2, mystical: 0.1},
	wagon: {melee: 0, ranged: 0, mystical: 0},
	cleric: {melee: 0.1, ranged: 0.5, mystical: 0.8},
	wallguard: {melee: 0.6, ranged: 0.6, mystical: 0},
	mystic: {melee: 0.95, ranged: 0.95, mystical: 0.1}
}

export const BASE_HEALTH: Readonly<Record<ArmyType, number>> = {
	villager: 15,
	archer: 20,
	swordfighter: 40,
	wagon: 100,
	cleric: 20,
	wallguard: 20,
	mystic: Number.NaN // Defined by each mystic individually
}

export const BASE_ATTACK: Readonly<Record<ArmyType, Attack>> = {
	villager: {type: 'melee', strength: 3},
	archer: {type: 'ranged', strength: 15},
	swordfighter: {type: 'melee', strength: 15},
	wagon: {type: 'melee', strength: 0},
	cleric: {type: 'mystical', strength: 30},
	wallguard: {type: 'ranged', strength: 15},
	mystic: {type: 'mystical', strength: 100}
}

export const UNIT_COST: Readonly<Record<BarracksArmyType, Resources>> = {
	villager: {food: 100, wood: 40, loam: 10, stone: 0, iron: 0},
	archer: {food: 500, wood: 400, loam: 100, stone: 0, iron: 40},
	swordfighter: {food: 1500, wood: 200, loam: 400, stone: 200, iron: 800},
	wagon: {food: 800, wood: 2000, loam: 0, stone: 0, iron: 300}
}

export const UNIT_LOOT_CAPACITY: Readonly<Record<BarracksArmyType, number>> = {
	villager: 50,
	archer: 20,
	swordfighter: 70,
	wagon: 400
}

export type BarracksUnits = Readonly<Record<BarracksArmyType, number>>

export const ZERO_BARRACKS_UNITS: BarracksUnits = {
	archer: 0,
	swordfighter: 0,
	villager: 0,
	wagon: 0
}

export function calcMaxPeoplePerBarracks(currentBarracksLevel: number): number {
	return currentBarracksLevel * 10
}

export function calcUnitSum(units: Readonly<Record<string, number>>): number {
	return Object.keys(units)
		.map(key => units[key])
		.filter(num => typeof num === 'number' && Number.isFinite(num))
		.reduce((a, b) => a + b, 0)
}
