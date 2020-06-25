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
	townhall: {food: 2000, wood: 1500, loam: 1500, stone: 1000, iron: 500},
	marketplace: {food: 1000, wood: 800, loam: 400, stone: 200, iron: 50},
	storage: {food: 300, wood: 550, loam: 550, stone: 350, iron: 150},
	sawmill: {food: 100, wood: 40, loam: 150, stone: 5, iron: 3},
	loampit: {food: 100, wood: 150, loam: 40, stone: 15, iron: 1},
	quarry: {food: 120, wood: 150, loam: 80, stone: 10, iron: 5},
	mine: {food: 140, wood: 200, loam: 200, stone: 70, iron: 30},
	farm: {food: 0, wood: 180, loam: 180, stone: 10, iron: 5},
	barracks: {food: 500, wood: 400, loam: 200, stone: 10, iron: 100},
	wall: {food: 500, wood: 400, loam: 400, stone: 700, iron: 300},
	placeOfWorship: {food: 5000, wood: 5000, loam: 5000, stone: 3500, iron: 1000}
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
				food: 30 * nextLevel,
				wood: 10 * nextLevel,
				loam: 10 * nextLevel,
				stone: 5 * nextLevel,
				iron: 2 * nextLevel
			}
		case 'farm':
			return {...ZERO_RESOURCES, food: currentLevel * 15}
		case 'sawmill':
			return {...ZERO_RESOURCES, wood: currentLevel * 5, food: currentLevel * -2}
		case 'loampit':
			return {...ZERO_RESOURCES, loam: currentLevel * 5, food: currentLevel * -2}
		case 'quarry':
			return {...ZERO_RESOURCES, stone: currentLevel * 3, food: currentLevel * -3}
		case 'mine':
			return {...ZERO_RESOURCES, iron: currentLevel, food: currentLevel * -5}
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
