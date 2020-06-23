import {Context} from '../context'
import {MINUTE} from '../unix-time'

import {formatNumberShort} from './format-number'

export async function formatCooldown(ctx: Context, seconds: number): Promise<string> {
	let text = ''

	if (seconds > 2 * MINUTE) {
		const minutes = seconds / MINUTE
		text += formatNumberShort(minutes, true)
		text += ' '
		text += (await ctx.wd.reader('unit.minute')).label()
		return text
	}

	text += formatNumberShort(seconds)
	text += ' '
	text += (await ctx.wd.reader('unit.second')).label()
	return text
}
