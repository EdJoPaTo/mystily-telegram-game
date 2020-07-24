import {FEMALE, UNISEX, MALE} from 'wikidata-person-names'
import {MenuTemplate, Body, replyMenuToContext, deleteMenuFromContext} from 'telegraf-inline-menu'
import randomItem from 'random-item'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {Context, Name} from '../../../lib/context'
import {DAY, MINUTE} from '../../../lib/unix-time'
import {formatNamePlain} from '../../../lib/interface/name'
import {EMOJI} from '../../../lib/interface/emoji'

const CHANGE_EACH_SECONDS = DAY * 7

function getNextChange(name: Name | undefined): number {
	const lastChange = name?.lastChangeFirst ?? 0
	return lastChange + CHANGE_EACH_SECONDS
}

function canChangeFirstName(name: Name | undefined): boolean {
	const now = Date.now() / 1000
	const nextChange = getNextChange(name)
	return now > nextChange
}

async function menuBody(ctx: Context): Promise<Body> {
	let text = ''

	text += EMOJI.name
	text += ' '
	text += '*'
	text += ctx.i18n.t('name.question.first')
	text += '*'

	text += '\n\n'
	text += ctx.i18n.t('name.info.first').trim()

	if (ctx.session.name) {
		text += '\n\n'
		text += await ctx.wd.reader('menu.name').then(r => r.label())
		text += ': '
		text += formatNamePlain(ctx.session.name)
	}

	const now = Date.now() / 1000
	const nextChange = getNextChange(ctx.session.name)
	if (nextChange > now) {
		const remainingSeconds = nextChange - now
		const remainingMinutes = remainingSeconds / MINUTE

		text += '\n\n'
		text += await ctx.wd.reader('name.change').then(r => r.label())
		text += ': '
		text += remainingMinutes.toFixed(0)
		text += ' '
		text += await ctx.wd.reader('unit.minute').then(r => r.label())
	} else if (ctx.session.createFirst) {
		text += '\n\n'
		text += ctx.i18n.t('name.new.first')
		text += ': '
		text += ctx.session.createFirst
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.choose('random', ['female', 'unisex', 'male'], {
	columns: 3,
	hide: ctx => !canChangeFirstName(ctx.session.name),
	buttonText: (_, key) => {
		switch (key) {
			case 'female':
				return EMOJI.nameFemale
			case 'male':
				return EMOJI.nameMale
			default:
				return EMOJI.nameUnisex
		}
	},
	do: (ctx, key) => {
		switch (key) {
			case 'female':
				ctx.session.createFirst = randomItem(FEMALE)
				break
			case 'male':
				ctx.session.createFirst = randomItem(MALE)
				break
			default:
				ctx.session.createFirst = randomItem(UNISEX)
				break
		}

		return '.'
	}
})

export const nameQuestion = new TelegrafStatelessQuestion<Context>('name', async ctx => {
	const name = ctx.message.text
	const correctFormat = /^[a-zA-Z]{4,15}$/.test(name ?? '')

	if (correctFormat) {
		ctx.session.createFirst = name
	} else {
		await ctx.reply(ctx.i18n.t('name.info.firstRules'))
	}

	await replyMenuToContext(menu, ctx, '/name/first/')
})

menu.interact(async ctx => (await ctx.wd.reader('name.freewill')).label(), 'question', {
	hide: ctx => !canChangeFirstName(ctx.session.name),
	do: async ctx => {
		await nameQuestion.replyWithHTML(ctx, ctx.i18n.t('name.question.first'))
		await deleteMenuFromContext(ctx)
		return false
	}
})

menu.interact(ctx => `😍 ${ctx.i18n.t('name.take')}`, 'take', {
	hide: ctx => !ctx.session.createFirst || !canChangeFirstName(ctx.session.name),
	do: ctx => {
		const now = Date.now() / 1000
		ctx.session.name = {
			...(ctx.session.name ?? {}),
			first: ctx.session.createFirst!,
			lastChangeFirst: now
		}

		delete ctx.session.createFirst
		return '..'
	}
})

menu.interact(ctx => `😒 ${ctx.i18n.t('name.reject')}`, 'reject', {
	joinLastRow: true,
	hide: ctx => !ctx.session.name,
	do: ctx => {
		delete ctx.session.createLast
		return '..'
	}
})
