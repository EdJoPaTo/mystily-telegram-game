import {createBackMainMenuButtons} from 'telegraf-inline-menu'

import {Context} from '../context'

type MaybePromise<T> = T | Promise<T>
type ContextFunction<T> = (context: Context) => MaybePromise<T>
type ConstOrContextFunction<T> = T | ContextFunction<T>

export const backButtons = createBackMainMenuButtons<Context>(
	ctx => `🔙 ${ctx.i18n.t('menu.back')}`,
	async ctx => `🔝 ${(await ctx.wd.reader('menu.menu')).label()}`
)

export function buttonText(emoji: string, label: ConstOrContextFunction<string>): (context: Context) => Promise<string> {
	return async context => {
		const labelString = typeof label === 'string' ? label : await label(context)
		return `${emoji} ${labelString}`
	}
}

export function wdButtonText(emoji: string, wdKey: string): (context: Context) => Promise<string> {
	return async context => {
		const reader = await context.wd.reader(wdKey)
		const label = reader.label()
		return `${emoji} ${label}`
	}
}
