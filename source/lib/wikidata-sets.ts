import randomItem from 'random-item'
import {sparqlQuerySimplifiedMinified} from 'wikidata-sdk-got'

export type Query = 'mystics' | 'spies'

const queries: Record<Query, string> = {
	mystics: `SELECT DISTINCT ?item WHERE {
?item wdt:P279* wd:Q2239243.
?item wdt:P18 ?image.
}`,
	spies: `SELECT DISTINCT ?item WHERE {
?item wdt:P279+ wd:Q729.
?item wdt:P487 ?emoji.
}`
}

const entities: Record<Query, string[]> = {
	mystics: [],
	spies: []
}

export async function build(): Promise<void> {
	console.time('wikidata-sets')
	await Promise.all(
		Object.keys(queries)
			.map(async key => loadQNumbersOfKey(key as Query))
	)

	console.timeEnd('wikidata-sets')
}

async function loadQNumbersOfKey(key: Query): Promise<void> {
	try {
		const results = await sparqlQuerySimplifiedMinified(queries[key])
		const qNumbers = results as string[]
		entities[key] = qNumbers
	} catch (error) {
		console.error('wikidata-set query failed', key, error)
	}
}

export function get(key: Query): readonly string[] {
	return entities[key]
}

export function getRandom(key: Query): string {
	return randomItem(get(key))
}
