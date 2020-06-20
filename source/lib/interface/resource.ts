import {Context} from '../context'
import {Resource, Resources, RESOURCES} from '../model'

import {formatNumberShort} from './format-number'
import {EMOJI, possibleEmoji} from './emoji'

export async function currentResourceLine(ctx: Context, resource: Resource, amount: number, capacity: number): Promise<string> {
	const reader = await ctx.wd.reader(`resource.${resource}`)
	const parts: string[] = []

	parts.push(EMOJI[resource])
	parts.push(`*${reader.label()}*`)
	parts.push(`_${formatNumberShort(amount, true)}_`)
	parts.push('/')
	parts.push(formatNumberShort(capacity, true))

	return parts.join(' ')
}

export async function costResourceLine(ctx: Context, resource: Resource, required: number, available: number): Promise<string> {
	const reader = await ctx.wd.reader(`resource.${resource}`)
	const parts: string[] = []

	parts.push(possibleEmoji(available >= required))
	parts.push(EMOJI[resource])
	parts.push(`*${reader.label()}*`)
	parts.push(formatNumberShort(available, true))
	parts.push('/')
	parts.push(formatNumberShort(required, true))

	return parts.join(' ')
}

export async function incomeResourceLine(ctx: Context, resource: Resource, amount: number): Promise<string> {
	const reader = await ctx.wd.reader(`resource.${resource}`)
	const readerDay = await ctx.wd.reader('unit.day')
	const parts: string[] = []

	parts.push(EMOJI[resource])
	parts.push(`*${reader.label()}*`)
	const sign = amount >= 0 ? '+' : ''
	parts.push(sign + formatNumberShort(amount, true))
	parts.push('/')
	parts.push(readerDay.label())

	return parts.join(' ')
}

export async function currentResourcesPart(ctx: Context, resources: Resources, storageCapacity: Resources): Promise<string> {
	const lines = await Promise.all(RESOURCES
		.map(async o => currentResourceLine(ctx, o, resources[o], storageCapacity[o]))
	)

	return lines.join('\n')
}

export async function upgradeResourcesPart(ctx: Context, required: Resources, available: Resources): Promise<string> {
	const labelReader = await ctx.wd.reader('action.upgrade')
	const lines = await Promise.all(RESOURCES
		.map(async o => costResourceLine(ctx, o, required[o], available[o]))
	)

	return `*${labelReader.label()}*\n${lines.join('\n')}`
}

export async function incomeResourcesPart(ctx: Context, income: Resources): Promise<string> {
	const labelReader = await ctx.wd.reader('other.income')
	const lines = await Promise.all(RESOURCES
		.filter(o => o === 'food' || income[o] > 0)
		.map(async o => incomeResourceLine(ctx, o, income[o]))
	)

	return `*${labelReader.label()}*\n${lines.join('\n')}`
}
