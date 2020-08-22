import {Context as TelegrafContext} from 'telegraf'
import {I18n} from 'telegraf-i18n'
import {MiddlewareProperty} from 'telegraf-wikibase'

import {BarracksUnits} from './model/units'
import {Buildings} from './model/buildings'
import {Resources} from './model/resources'

type QNumber = string
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
	attackTime?: UnixSeconds;
	attackTarget?: UserId;
	barracksUnits: BarracksUnits;
	battleCooldownEnd?: UnixSeconds;
	battleFatigueEnd?: UnixSeconds;
	blocked?: boolean;
	buildings: Buildings;
	createFirst?: string;
	createLast?: string | false;
	immuneToPlayerAttacksUntil: UnixSeconds;
	lastMysticAttack: UnixSeconds;
	name?: Name;
	page?: number;
	resources: Resources;
	resourcesTimestamp: UnixSeconds;
	spies: QNumber[];
	wallguards: number;
}

export interface Context extends TelegrafContext {
	readonly i18n: I18n;
	readonly session: Session;
	readonly wd: MiddlewareProperty;
}
