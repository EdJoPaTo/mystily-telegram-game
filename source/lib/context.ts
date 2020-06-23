import {Context as TelegrafContext} from 'telegraf'
import {I18n} from 'telegraf-i18n'
import {MiddlewareProperty} from 'telegraf-wikibase'

import {Buildings, Resources, PlayerUnits} from './model'

type UnixSeconds = number
type UserId = number

export interface Name {
	readonly first: string;
	readonly last?: string;
	readonly lastChangeFirst?: UnixSeconds;
	readonly lastChangeLast?: UnixSeconds;
}

export interface Session {
	__wikibase_language_code?: string;
	attackTarget?: UserId;
	battleCooldownEnd?: UnixSeconds;
	battleFatigueEnd?: UnixSeconds;
	blocked?: boolean;
	buildings: Buildings;
	createFirst?: string;
	createLast?: string | false;
	lastMysticAttack: UnixSeconds;
	name?: Name;
	page?: number;
	resources: Resources;
	resourcesTimestamp: UnixSeconds;
	selectedSpy: string;
	selectedSpyEmoji: string;
	units: PlayerUnits;
}

export interface Context extends TelegrafContext {
	readonly i18n: I18n;
	readonly session: Session;
	readonly wd: MiddlewareProperty;
}
