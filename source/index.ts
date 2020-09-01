import {existsSync, readFileSync} from 'fs'

import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {Telegraf, Composer} from 'telegraf'
import {TelegrafWikibase, resourceKeysFromYaml} from 'telegraf-wikibase'

import {Context} from './lib/context'
import {i18n} from './lib/i18n'
import * as attackingMystics from './mystics-attacking'
import * as ensureSessionContent from './lib/session-state-math'
import * as userSessions from './lib/user-sessions'
import * as wdSets from './lib/wikidata-sets'

import {bot as privateChatComposer} from './private-chat'
import {bot as tribunalChatComposer, TRIBUNAL_CHAT} from './tribunal'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf<Context>(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(generateUpdateMiddleware())
}

const twb = new TelegrafWikibase({
	contextKey: 'wd',
	logQueriedEntityIds: process.env.NODE_ENV !== 'production',
	userAgent: 'EdJoPaTo/mystily-telegram-game'
})

const wikidataResourceKeyYaml = readFileSync('wikidata-items.yaml', 'utf8')
twb.addResourceKeys(resourceKeysFromYaml(wikidataResourceKeyYaml))

bot.use(Composer.optional(ctx => Boolean(ctx.from),
	userSessions.middleware(),
	ensureSessionContent.middleware(),
	i18n.middleware(),
	twb.middleware(),
	async (ctx, next) => {
		delete ctx.session.blocked
		return next()
	}
))

attackingMystics.start(bot.telegram, twb)

bot.use(Composer.privateChat(privateChatComposer))
bot.use(Composer.optional(ctx => ctx.updateType === 'poll' || ctx.chat?.id === TRIBUNAL_CHAT, tribunalChatComposer))

bot.catch((error: any) => {
	console.error('telegraf error occured', error)
})

async function startup(): Promise<void> {
	await bot.telegram.setMyCommands([
		{command: 'start', description: 'show the menu'}
	])

	console.time('preload wdSets')
	await wdSets.build()
	console.timeEnd('preload wdSets')

	await twb.startRegularResourceKeyUpdate(error => {
		console.error('TelegrafWikibase', 'regular update failed', error)
	})

	await bot.launch()
	console.log(new Date(), 'Bot started as', bot.options.username)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
