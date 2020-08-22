import {MiddlewareFn} from 'telegraf/typings/composer'
import LocalSession from 'telegraf-session-local'
import randomItem from 'random-item'

import {Context, Session} from './context'

interface SessionRawEntry {
	readonly user: number;
	readonly data: Session;
}

const localSession = new LocalSession<Session>({
	// Database name/path, where sessions will be located (default: 'sessions.json')
	database: 'persist/sessions.json',
	// Format of storage/database (default: JSON.stringify / JSON.parse)
	format: {
		serialize: object => JSON.stringify(object, null, '\t') + '\n',
		deserialize: string => JSON.parse(string)
	},
	getSessionKey: context => String(context.from!.id)
})

export function getRaw(): readonly SessionRawEntry[] {
	return (localSession.DB as any)
		.get('sessions').value()
		.map((o: {id: string; data: Session}) => {
			const user = Number(o.id.split(':')[0])
			return {user, data: o.data}
		})
}

export function getUser(userId: number): Session | undefined {
	return (localSession.DB as any)
		.get('sessions')
		.getById(`${userId}`)
		.get('data')
		.value()
}

export function getRandomUser(filter: (o: SessionRawEntry, index: number) => boolean = () => true): SessionRawEntry | undefined {
	const rawArray = getRaw()
		.filter((o, i) => filter(o, i))
	return randomItem(rawArray)
}

export function middleware(): MiddlewareFn<Context> {
	return localSession.middleware()
}
