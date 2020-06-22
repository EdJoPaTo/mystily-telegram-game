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
	townhall: {food: 800, wood: 800, loam: 800, stone: 400, iron: 100},
	marketplace: {food: 500, wood: 500, loam: 200, stone: 100, iron: 20},
	storage: {food: 300, wood: 550, loam: 550, stone: 350, iron: 150},
	sawmill: {food: 30, wood: 5, loam: 20, stone: 1, iron: 1},
	loampit: {food: 30, wood: 20, loam: 5, stone: 1, iron: 1},
	quarry: {food: 30, wood: 20, loam: 5, stone: 3, iron: 3},
	mine: {food: 30, wood: 30, loam: 30, stone: 15, iron: 5},
	farm: {food: 0, wood: 10, loam: 10, stone: 1, iron: 1},
	barracks: {food: 500, wood: 400, loam: 200, stone: 10, iron: 100},
	wall: {food: 500, wood: 400, loam: 400, stone: 700, iron: 300},
	placeOfWorship: {food: 2000, wood: 1700, loam: 1700, stone: 1000, iron: 800}
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
	switch (building) {
		case 'townhall':
			return {
				food: 8 * currentLevel,
				wood: 4 * currentLevel,
				loam: 4 * currentLevel,
				stone: 2 * currentLevel,
				iron: currentLevel
			}
		case 'farm':
			return {...ZERO_RESOURCES, food: currentLevel * 10}
		case 'sawmill':
			return {...ZERO_RESOURCES, wood: currentLevel * 8, food: currentLevel * -2}
		case 'loampit':
			return {...ZERO_RESOURCES, loam: currentLevel * 8, food: currentLevel * -2}
		case 'quarry':
			return {...ZERO_RESOURCES, stone: currentLevel * 5, food: currentLevel * -3}
		case 'mine':
			return {...ZERO_RESOURCES, iron: currentLevel * 2, food: currentLevel * -5}
		default:
			return {...ZERO_RESOURCES, food: currentLevel * -1}
	}
}

export function calcStorageCapacity(currentLevel: number): Resources {
	const factor = currentLevel + 1
	return {
		food: factor * 800,
		wood: factor * 600,
		loam: factor * 600,
		stone: factor * 400,
		iron: factor * 200
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
