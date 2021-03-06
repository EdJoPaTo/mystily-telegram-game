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
	villager: {food: 50, wood: 20, loam: 10, stone: 0, iron: 0},
	archer: {food: 200, wood: 150, loam: 30, stone: 0, iron: 20},
	swordfighter: {food: 400, wood: 50, loam: 100, stone: 50, iron: 300},
	wagon: {food: 400, wood: 700, loam: 0, stone: 0, iron: 100}
}

export const UNIT_LOOT_CAPACITY: Readonly<Record<BarracksArmyType, number>> = {
	villager: 200,
	archer: 100,
	swordfighter: 150,
	wagon: 800
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
		.filter(amount => typeof amount === 'number' && Number.isFinite(amount))
		.reduce((a, b) => a + b, 0)
}
