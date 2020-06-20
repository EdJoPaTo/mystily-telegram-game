export function applyOnEachRecordKey<Key extends string, Value, Result>(func: (value: Value, key: Key) => Result, record: Readonly<Record<Key, Value>>): Record<Key, Result> {
	const result: Record<string, Result> = {}

	const keys = Object.keys(record) as Key[]
	for (const key of keys) {
		result[key] = func(record[key], key)
	}

	return result
}

export function joinTwoRecords<Key extends string, Value, Result>(func: (a: Value, b: Value, key: Key) => Result, a: Readonly<Record<Key, Value>>, b: Readonly<Record<Key, Value>>): Record<Key, Result> {
	const result: Record<string, Result> = {}

	const keys = Object.keys(a) as Key[]
	for (const key of keys) {
		result[key] = func(a[key], b[key], key)
	}

	return result
}
