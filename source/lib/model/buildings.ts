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
