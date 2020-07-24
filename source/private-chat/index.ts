import {Composer} from 'telegraf'
import {MenuMiddleware} from 'telegraf-inline-menu'

import {Context} from '../lib/context'

import {menu} from './menu'

export const bot = new Composer<Context>()

const menuMiddleware = new MenuMiddleware('/', menu)
bot.command('start', async ctx => menuMiddleware.replyToContext(ctx))
bot.use(menuMiddleware.middleware())

bot.command('restart', async ctx => {
	await ctx.reply('/yesimsureeverythingwillbegone')
})

bot.command('yesimsureeverythingwillbegone', async ctx => {
	(ctx.session as any) = {}
	await ctx.reply('-> /start')
})
