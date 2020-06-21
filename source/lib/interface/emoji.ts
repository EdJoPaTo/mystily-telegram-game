import randomItem from 'random-item'

export const EMOJI = {
	army: '⚔',
	war: '⚔',
	search: '🔎',
	attack: '⚔',
	defence: '🛡',
	trade: '🎪',

	food: '🥕',
	wood: '🌲',
	loam: '🧱',
	stone: '⛰',
	iron: '🔩',

	buildings: '🏘',
	townhall: '🏤',
	houses: '🏘',
	marketplace: '🤝',
	storage: '🏚',
	farm: '🌻',
	sawmill: '🪓',
	loampit: '🧱',
	quarry: '⛏',
	mine: '🪔',
	barracks: '🛡',
	wall: '🏰',
	placeOfWorship: '🏛',

	people: '👥',
	archer: '🏹',
	swordfighter: '🗡',
	villager: '🪕',
	cleric: '📿',
	mystic: '🐲',

	melee: '✊',
	ranged: '🎯',
	mystical: '🌈',

	activeUser: '💙',
	betrayal: '😈',
	chat: '💭',
	fire: '🔥',
	health: '❤️',
	language: '🏳️‍🌈',
	lose: '😭',
	name: '👋',
	nameFallback: '🔮',
	possibleNo: '⛔️',
	possibleYes: '✅',
	recruit: '🎽',
	statistics: '📊',
	suicide: '😵',
	win: '🎉',
	withoutLastName: '🎭'
}

export const FAMILY_EMOJIS: readonly string[] = ['👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👦‍👦', '👩‍👧‍👧', '👨‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👦‍👦', '👨‍👧‍👧']

export function possibleEmoji(condition: boolean): string {
	return condition ? EMOJI.possibleYes : EMOJI.possibleNo
}

export function randomFamilyEmoji(): string {
	return randomItem(FAMILY_EMOJIS)
}
