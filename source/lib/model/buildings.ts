import {Resources, ZERO_RESOURCES} from './resources'

export type Building =
	'barracks' |
	'farm' |
	'loampit' |
	'marketplace' |
	'mine' |
	'placeOfWorship' |
	'quarry' |
	'sawmill' |
	'storage' |
	'townhall' |
	'wall'

export const BUILDINGS: readonly Building[] = [
	'townhall',
	'storage',
	'marketplace',
	'sawmill',
	'loampit',
	'quarry',
	'mine',
	'farm',
	'barracks',
	'wall',
	'placeOfWorship'
]

export type Buildings = Readonly<Record<Building, number>>

export const ZERO_BUILDINGS: Buildings = {
	barracks: 0,
	farm: 0,
	loampit: 0,
	marketplace: 0,
	mine: 0,
	placeOfWorship: 0,
	quarry: 0,
	sawmill: 0,
	storage: 0,
	townhall: 0,
	wall: 0
}

const FACTORS: Readonly<Record<Building, Resources>> = {
	townhall: {food: 6000, wood: 4500, loam: 4500, stone: 3000, iron: 1500},
	marketplace: {food: 3000, wood: 2400, loam: 1200, stone: 600, iron: 150},
	storage: {food: 2500, wood: 3000, loam: 3000, stone: 1500, iron: 800},
	sawmill: {food: 300, wood: 100, loam: 450, stone: 15, iron: 10},
	loampit: {food: 300, wood: 450, loam: 100, stone: 50, iron: 3},
	quarry: {food: 350, wood: 450, loam: 250, stone: 30, iron: 15},
	mine: {food: 400, wood: 600, loam: 600, stone: 150, iron: 80},
	farm: {food: 0, wood: 500, loam: 500, stone: 30, iron: 15},
	barracks: {food: 1500, wood: 1200, loam: 600, stone: 50, iron: 300},
	wall: {food: 1500, wood: 1200, loam: 1200, stone: 2100, iron: 900},
	placeOfWorship: {food: 15000, wood: 15000, loam: 15000, stone: 10000, iron: 3000}
}

export function calcBuildingCost(building: Building, currentLevel: number): Resources {
	const nextLevel = currentLevel + 1
	return {
		food: nextLevel * FACTORS[building].food,
		iron: nextLevel * FACTORS[building].iron,
		loam: nextLevel * FACTORS[building].loam,
		stone: nextLevel * FACTORS[building].stone,
		wood: nextLevel * FACTORS[building].wood
	}
}

export function calcResourceIncomeFromBuilding(building: Building, currentLevel: number): Resources {
	const nextLevel = currentLevel + 1
	switch (building) {
		case 'townhall':
			return {
				food: 25 * nextLevel,
				wood: 8 * nextLevel,
				loam: 8 * nextLevel,
				stone: 4 * nextLevel,
				iron: 2 * nextLevel
			}
		case 'farm':
			return {...ZERO_RESOURCES, food: currentLevel * 12}
		case 'sawmill':
			return {...ZERO_RESOURCES, wood: currentLevel * 4, food: currentLevel * -2}
		case 'loampit':
			return {...ZERO_RESOURCES, loam: currentLevel * 4, food: currentLevel * -2}
		case 'quarry':
			return {...ZERO_RESOURCES, stone: currentLevel * 2, food: currentLevel * -3}
		case 'mine':
			return {...ZERO_RESOURCES, iron: currentLevel, food: currentLevel * -5}
		default:
			return {...ZERO_RESOURCES, food: currentLevel * -1}
	}
}

export function calcStorageCapacity(currentLevel: number): Resources {
	const factor = currentLevel + 1
	return {
		food: factor * 5000,
		wood: factor * 4000,
		loam: factor * 4000,
		stone: factor * 2000,
		iron: factor * 1000
	}
}

export function calcBarracksMaxPeople(currentLevel: number): number {
	return currentLevel * 8
}

export function changeBuildingLevel(buildings: Buildings, building: Building, change: (before: number) => number): Buildings {
	return {
		...buildings,
		[building]: change(buildings[building])
	}
}
