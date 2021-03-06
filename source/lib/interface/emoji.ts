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
	spyForest: '🏕',
	placeOfWorship: '🏛',

	people: '👥',
	archer: '🏹',
	swordfighter: '🗡',
	villager: '🪕',
	wagon: '🛷',
	cleric: '📿',
	wallguard: '🗽',
	mystic: '🐲',

	melee: '✊',
	ranged: '🎯',
	mystical: '🌈',
	loot: '🧺',

	activeUser: '🥰',
	betrayal: '😈',
	chat: '💭',
	fire: '🔥',
	health: '❤️',
	espionage: '🔭',
	language: '🏳️‍🌈',
	lose: '😭',
	missing: '🥺',
	name: '👋',
	nameExists: '🛑',
	nameFallback: '🔮',
	nameFemale: '💁‍♀️',
	nameMale: '💁‍♂️',
	nameUnisex: '💁',
	possibleNo: '⛔️',
	possibleYes: '✅',
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
