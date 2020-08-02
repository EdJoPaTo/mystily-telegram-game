export type Resource = 'food' | 'wood' | 'loam' | 'stone' | 'iron'

export const RESOURCES: readonly Resource[] = ['wood', 'loam', 'stone', 'iron', 'food']

export type Resources = Readonly<Record<Resource, number>>

export const ZERO_RESOURCES: Resources = {
	food: 0,
	iron: 0,
	loam: 0,
	stone: 0,
	wood: 0
}

export const STARTING_RESOURCES: Resources = {
	food: 2000,
	wood: 1000,
	loam: 1000,
	stone: 200,
	iron: 50
}
