import {Composer} from 'telegraf'
import {FEMALE, UNISEX, MALE} from 'wikidata-person-names'

import * as userSessions from '../lib/user-sessions'

// Mystily Tribunal Chat and Test Supergroup
export const TRIBUNAL_CHAT = process.env.NODE_ENV === 'production' ? -1001416867790 : -1001110186215

export const bot = new Composer()

bot.command('report', async ctx => {
	const name = ctx.message?.text?.replace(/^\/\S+ /, '').toLowerCase()
	if (!name) {
		await ctx.reply('That doesnt look like a name?\nUse /report <name>')
		return
	}

	if (name === 'karen') {
		await ctx.reply('Sadly we wont get rid of Karen soon…')
		return
	}

	if (FEMALE.some(o => o.toLowerCase() === name)) {
		await ctx.reply('Thats a name from the Wikidata nameset (female)')
		return
	}

	if (UNISEX.some(o => o.toLowerCase() === name)) {
		await ctx.reply('Thats a name from the Wikidata nameset (unisex)')
		return
	}

	if (MALE.some(o => o.toLowerCase() === name)) {
		await ctx.reply('Thats a name from the Wikidata nameset (male)')
		return
	}

	if (!userSessions.getRaw().some(o => o.data.name?.first.toLowerCase() === name)) {
		await ctx.reply('No one has this name currently')
		return
	}

	await ctx.replyWithPoll(name, ['😳', '🤷'], {is_anonymous: false})
})

bot.on('poll', async ctx => {
	const now = Date.now() / 1000
	if (!ctx.poll) {
		throw new Error('what in the polls name?!')
	}

	if (ctx.poll.options[0].voter_count >= 3) {
		// When enough people think the name is not appropriate -> kill the name
		const name = ctx.poll.question.toLowerCase()
		const toBeChanged = userSessions.getRaw()
			.map(o => o.data)
			.filter(o => o.name?.first.toLowerCase() === name)

		for (const entry of toBeChanged) {
			entry.name = {
				first: 'Karen',
				lastChangeFirst: now,
				last: entry.name?.last,
				lastChangeLast: entry.name?.lastChangeLast
			}
		}

		// Cant stopPoll here. It needs the message id. ctx.poll does not have a message id. Why...?!

		await ctx.telegram.sendMessage(TRIBUNAL_CHAT, `${toBeChanged.length} less player with that ugly name ${name}.`)
	}
})

bot.use(async ctx => ctx.reply('Use /report <name>'))
