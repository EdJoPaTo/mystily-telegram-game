import {Composer} from 'telegraf'

export * from './chat-id'

import {bot as reportNameBot} from './report-name'

export const bot = new Composer()

bot.use(reportNameBot)
